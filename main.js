const displayedImage = document.querySelector('.displayed-img');
const thumbBar = document.querySelector('.thumb-bar');

const btn = document.querySelector('button');
const overlay = document.querySelector('.overlay');

/* Declaring the array of image filenames */
const imageFilenames = [
  'pic1.jpg',
  'pic2.jpg',
  'pic3.jpg',
  'pic4.jpg',
  'pic5.jpg',
]
/* Declaring the alternative text for each image file */
const imageDescriptions = [
  'Bunch of Kegs',
  'Roman Statue',
  'Boat in Venice for pic3',
  'Bridge in Venice',
  'London Bridge',
]
/* Looping through images */
for (let i = 0; i < imageFilenames.length; i++) {
const newImage = document.createElement('img');
newImage.setAttribute('src', `images/${imageFilenames[i]}`);
newImage.setAttribute('alt', imageDescriptions[i]);
thumbBar.appendChild(newImage);
newImage.addEventListener('click', (e) => {
  displayedImage.setAttribute('src', e.target.getAttribute('src'));
  displayedImage.setAttribute('alt', e.target.getAttribute('alt'));
});

/* Wiring up the Darken/Lighten button */
btn.addEventListener('click', () => {
    const btnClass = btn.getAttribute('class');
    if (btnClass === 'dark') {
btn.setAttribute('class', 'light');
btn.textContent = 'Lighten';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }
    else {
btn.setAttribute('class', 'dark');
btn.textContent = 'Darken';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    }
}
);}