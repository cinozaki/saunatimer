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
  background: url('./assets/wall-bg.jpg');
  background-size: cover;
  min-height: 100vh;
}
</style>
