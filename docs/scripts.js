// scripts.js

// Add scrolling interactions (example for visual effects)
document.addEventListener('DOMContentLoaded', () => {
    const visuals = document.querySelectorAll('.visual-panel');
    const observerOptions = {
      root: null,
      threshold: 0.5,
    };
  
    const handleIntersect = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    };
  
    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    visuals.forEach(visual => observer.observe(visual));
  });
  