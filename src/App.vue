<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <SaunaTimer></SaunaTimer>
  </div>
</template>

<script>
import 'normalize.css'
import SaunaTimer from './components/SaunaTimer.vue'

export default {
  name: 'App',
  components: {
    SaunaTimer
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding: 60px 0;
  min-height: 100vh;
  background-color: #c4a882;
  background-image:
    /* モルタル目地（横線） */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 48px,
      #d4c4a8 48px,
      #d4c4a8 60px
    ),
    /* レンガ色のムラ */
    repeating-linear-gradient(
      0deg,
      rgba(160, 70, 30, 0.6) 0px,
      rgba(180, 85, 40, 0.5) 20px,
      rgba(140, 60, 25, 0.6) 48px,
      transparent 48px,
      transparent 60px
    ),
    /* 縦の目地（奇数段） */
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 90px,
      #d4c4a8 90px,
      #d4c4a8 96px
    );
  background-size:
    100% 60px,
    100% 60px,
    192px 60px;
}
</style>
