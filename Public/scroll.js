// ScrollReveal animaciones alternadas
ScrollReveal().reveal('.info-block:not(.reverse)', {
  origin: 'left',
  distance: '60px',
  duration: 1000,
  easing: 'ease-out',
  interval: 200,
  reset: false
});

ScrollReveal().reveal('.info-block.reverse', {
  origin: 'right',
  distance: '60px',
  duration: 1000,
  easing: 'ease-out',
  interval: 200,
  reset: false
});