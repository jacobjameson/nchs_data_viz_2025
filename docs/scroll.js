document.addEventListener("DOMContentLoaded", function () {
  const mortalitySection = document.getElementById("mortality-section");
  if (mortalitySection && window.startMortalityAnimation) {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            window.startMortalityAnimation();
            observer.unobserve(mortalitySection);
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(mortalitySection);
  }
});
