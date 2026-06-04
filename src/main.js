import './style.css'
import { initForest } from './forest.js'

const introPage = document.getElementById('intro-page')
const mainPage = document.getElementById('main-page')
const enterButton = document.getElementById('enter-main')
const forestCanvas = document.getElementById('forest-canvas')

let forestStarted = false

enterButton.addEventListener('click', () => {
  introPage.classList.add('is-hidden')
  mainPage.classList.add('is-visible')
  mainPage.setAttribute('aria-hidden', 'false')

  if (!forestStarted) {
    forestStarted = true
    initForest(forestCanvas)
  }
})
