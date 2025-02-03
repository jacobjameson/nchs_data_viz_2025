library(tidyverse)
library(haven)
library(janitor)


# ------------------------------------------------------------------------------
# Demographics

download.file("https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/DEMO_L.xpt",
              demo <- tempfile(), mode="wb")

demo <- foreign::read.xport(demo) %>% 
  clean_names()

demo$riagendr <- factor(demo$riagendr, levels = c(1, 2), labels = c("Male", "Female"))
demo$ridreth1 <- factor(demo$ridreth1, levels = 1:5, 
                        labels = c("Mexican American", "Other Hispanic", 
                                   "Non-Hispanic White", "Non-Hispanic Black", 
                                   "Other Race"))

# ------------------------------------------------------------------------------
# PHQ-9
# Kroenke K, Spitzer RL, William JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med 2001; 16: 1606-13.
# Kroenke K, Spitzer RL. The PHQ-9: a new depression and diagnostic severity measure. Psych Annals 2002; 32:509-21.
# Spitzer RL, Kroenke K, Williams JB. Validation and utility of a self-report version of Prime MD: the PHQ primary care study. JAMA 1999; 282: 1737-44.

download.file("https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/DPQ_L.xpt",
              phq <- tempfile(), mode="wb")

phq <- foreign::read.xport(phq) %>% 
  clean_names()

phq_items <- c('dpq010', 'dpq020', 'dpq030', 'dpq040', 
               'dpq050', 'dpq060', 'dpq070', 'dpq080', 'dpq090')

phq[ , phq_items] <- lapply(phq[ , phq_items], function(x) {
  ifelse(x %in% c(7, 9), NA, x)
})

phq$phq9_score <- rowSums(phq[ , phq_items], na.rm = FALSE)

phq$depression_category <- cut(phq$phq9_score,
                               breaks = c(-1, 4, 9, 14, 19, 27),
                               labels = c("Minimal (0-4)", "Mild (5-9)", 
                                          "Moderate (10-14)", "Moderately Severe (15-19)", 
                                          "Severe (20-27)"),
                               right = TRUE)

# Optionally, look at the distribution of categories
table(phq$depression_category, useNA = "ifany")
hist(phq$phq9_score, breaks = 0:27, main = "Distribution of PHQ-9 Scores")

# ------------------------------------------------------------------------------
# HUQ: Health care access and utilization

download.file("https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/HUQ_L.xpt",
              ac <- tempfile(), mode="wb")

ac <- foreign::read.xport(ac) %>% 
  clean_names()

# HUQ010: General health condition
ac$huq010 <- factor(ac$huq010, 
                    levels = c(1, 2, 3, 4, 5, 7, 9),
                    labels = c("Excellent", "Very good", 
                               "Good", "Fair", "Poor", 
                               "Refused", "Don't know"))

# HUQ030: Routine place to go for healthcare
ac$huq030 <- factor(ac$huq030,
                    levels = c(1, 2, 3, 7, 9),
                    labels = c("Yes", "There is no place", 
                               "There is more than one place", 
                               "Refused", "Don't know"))

# HUQ042: Type place most often go for healthcare
ac$huq042 <- factor(ac$huq042,
                    levels = c(1, 2, 3, 4, 5, 6, 77, 99),
                    labels = c("A doctor's office or health center",
                               "Urgent care center or clinic in a drug store or grocery store",
                               "Emergency room",
                               "A VA medical center or VA outpatient clinic",
                               "Some other place",
                               "Doesn't go to one place most often",
                               "Refused",
                               "Don't know"))

# HUQ055: Past 12 months had video conference with a doctor?
ac$huq055 <- factor(ac$huq055,
                    levels = c(1, 2, 7, 9),
                    labels = c("Yes", "No", "Refused", "Don't know"))

# HUQ090: Seen mental health professional in the past year?
ac$huq090 <- factor(ac$huq090,
                    levels = c(1, 2, 7, 9),
                    labels = c("Yes", "No", "Refused", "Don't know"))


# ------------------------------------------------------------------------------

library(survey)

data <- demo %>%
  left_join(phq, by = "seqn") %>%
  left_join(ac, by = "seqn")

#creat 10 year age groups
data$age_group <- cut(data$ridageyr, breaks = c(0, 20, 40, 60, 80, 100), 
                      labels = c("0-20", "21-40", "41-60", "61-80", "81-100"))

demo_design <- svydesign(
  id = ~sdmvpsu,
  strata = ~sdmvstra,
  weights = ~wtint2yr,
  nest = TRUE,
  data = data
)

prop.table(svytable(~riagendr + ridreth1 + depression_category + huq090 + age_group, design = demo_design), 1)

# Assume your survey design object is demo_design
wt_counts <- svytable(~riagendr + ridreth1 + depression_category + huq090 + age_group, design = demo_design)

prop_counts <- prop.table(wt_counts, margin = 1)

df_counts <- as.data.frame.table(wt_counts)
df_props  <- as.data.frame.table(prop_counts)

names(df_counts) <- c("riagendr", "ridreth1", "depression_category", "huq090", 'age_group', "count")
names(df_props)  <- c("riagendr", "ridreth1", "depression_category", "huq090", 'age_group', "proportion")

df_final <- merge(df_counts, df_props,
                  by = c("riagendr", "ridreth1", "depression_category", 'age_group', "huq090"))


df_final <- df_final %>%
  rename('Gender' = 'riagendr',
         'Race/Ethnicity' = 'ridreth1',
         'PHQ_c' = 'depression_category',
         'Seen' = 'huq090',
         'Age' = 'age_group',
         'Count' = 'count',
         'Proportion' = 'proportion')

write.csv(df_final, "docs/NHANES.csv", row.names = FALSE)

write.csv(WISQARS, "docs/WISQARS.csv", row.names = FALSE)


