# Load required libraries
library(tidyverse)
library(ggthemes)

# Helper function to process mortality data
process_mortality_data <- function(file_path, strictness = NULL, method = NULL, mode = NULL, has_gender = TRUE) {
  # Define columns to select based on whether gender is present
  cols_to_select <- if (has_gender) {
    c("Gender", "Deaths", "Single-Year Ages Code", "Population")
  } else {
    c("Deaths", "Single-Year Ages Code", "Population")
  }
  
  # Read and process data
  data <- read_delim(
    file_path,
    delim = "\t",
    col_names = TRUE,
    col_types = cols(
      Deaths = col_double(),
      `Single-Year Ages Code` = col_double(),
      Population = col_double()
    )
  ) %>%
    select(all_of(cols_to_select)) %>%
    rename(
      agegroup = `Single-Year Ages Code`,
      pop = Population,
      deaths = Deaths
    )
  
  # Add gender column name if present
  if (has_gender) {
    data <- rename(data, gender = Gender)
  }
  
  # Process data
  data <- data %>%
    na.omit() %>%
    filter(agegroup >= 15, agegroup <= 84) %>%
    mutate(
      deaths_100k = deaths/pop * 100000,
      strictness = strictness,
      method = method,
      mode = mode
    )
  
  return(data)
}

# Process suicide data
suicide_data <- list(
  firearm_permissive = list(
    path = "data/raw/single age/Firearm Suicide 2018-2022 Permissive States.txt",
    strictness = "Permissive",
    mode = "Firearm"
  ),
  firearm_strict = list(
    path = "data/raw/single age/Firearm Suicide 2018-2022 Strict States.txt",
    strictness = "Strict",
    mode = "Firearm"
  ),
  nonfirearm_permissive = list(
    path = "data/raw/single age/Non-Firearm Suicide 2018-2022 Permissive States.txt",
    strictness = "Permissive",
    mode = "Non-Firearm"
  ),
  nonfirearm_strict = list(
    path = "data/raw/single age/Non-Firearm Suicide 2018-2022 Strict States.txt",
    strictness = "Strict",
    mode = "Non-Firearm"
  )
) %>%
  map_dfr(~process_mortality_data(
    file_path = .x$path,
    strictness = .x$strictness,
    method = "Suicide",
    mode = .x$mode
  ))

# Process homicide data
homicide_data <- list(
  firearm = list(
    path = "data/raw/single age/firearm_homicides_2018_2022.txt",
    mode = "Firearm"
  ),
  nonfirearm = list(
    path = "data/raw/single age/nonfirearm_homicides_2018_2022.txt",
    mode = "Non-Firearm"
  )
) %>%
  map_dfr(~process_mortality_data(
    file_path = .x$path,
    strictness = "All States",
    method = "Homicide",
    mode = .x$mode,
    has_gender = FALSE
  ))

# Combine all data
data <- bind_rows(suicide_data, homicide_data)

# Save the processed data
write_csv(data, "data/processed/mortality_data_stratified.csv")
