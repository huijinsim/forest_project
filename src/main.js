import './style.css'

const introPage = document.getElementById('intro-page')
const mainPage = document.getElementById('main-page')
const enterButton = document.getElementById('enter-main')

enterButton.addEventListener('click', () => {
  introPage.classList.add('is-hidden')
  mainPage.classList.add('is-visible')
  mainPage.setAttribute('aria-hidden', 'false')
})
