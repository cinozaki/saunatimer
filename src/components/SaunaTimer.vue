<template>
  <div class="saunatimer">
    <div class="saunatimer__logo">SAUNA</div>
    <div class="saunatimer__circle"></div>
    <div class="saunatimer__second" :style="{transform:secondRotateDeg}"></div>
    <div class="saunatimer__minute" :style="{transform:minuteRotateDeg}"></div>
    <b class="hour" v-for="h in timeList" :key="h">
      <span>
        <i :style="{transform:transform}">{{h}}</i>
      </span>
    </b>
    <div class="saunatimer__title">12min</div>
  </div>
</template>

<script>
export default {
  data () {
      return {
          timeList: [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          secondRotateDeg: 'rotateZ(360deg)',
          minuteRotateDeg: 'rotateZ(0deg)',
          transform: 1
      };
    },
    // watch: {
    //   time() {
    //     this.show();
    //   }
    // },
    methods: {
      show() {
        this.showTime();
        this._timer = setInterval(()=> {
          this.showTime();
        }, 100);
      },
      showTime() {
        let times;
        const now = new Date();
        times = [now.getMinutes(), now.getSeconds(), now.getMilliseconds()];

        let minute = times[0];
        let second = times[1];
        let millisecond = times[2];
        let minuteAngle = minute * 30 + second / 2 + millisecond / 2000;
        let secondAngle = 360 + second * 6 + (6 * millisecond/1000);
        this.minuteRotateDeg = `rotateZ(${minuteAngle}deg)`;
        this.secondRotateDeg = `rotateZ(${secondAngle}deg)`;
      }
    },
    mounted() {
      this.show();
    }
}
</script>

<style lang="scss" scoped>
  @import url('https://fonts.googleapis.com/css2?family=Overpass:wght@900&display=swap');

  .saunatimer {
    position: relative;
    display: block;
    margin: 0 auto;
    width: 256px;
    height: 256px;
    background: #fff;
        box-shadow: 
        inset 40px 40px 40px rgba(0,0,0,.1),
        inset -5px 0px 20px rgba(0,0,0, 0.4), 
        20px 20px 30px rgba(0,0,0,.4),
        40px 40px 60px rgba(0,0,0,.4);
    border: 8px solid #eee;
    border-radius: 256px;
    z-index: 0;

    // 真ん中
    &__circle {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 12px;
      transform: translate(-50%, -50%);
      background: red;
      border-radius: 16px;
      z-index: 2;
    }

    // 秒針
    &__second {
      position: absolute;
      top: 5%;
      left: 50%;
      display: block;
      width: 6px;
      height: 45%;
      margin-left: -3px;
      background: red;
      border-radius: 4px;
      transform: rotateZ(360deg);
      transform-origin: bottom;
      z-index: 2;
      // transition-duration: 0.1s;
    }

    // 分針
    &__minute {
      position: absolute;
      top: 15%;
      left: 50%;
      display: block;
      width: 12px;
      height: 35%;
      margin-left: -6px;
      background: #333;
      border-radius: 4px;
      transform: rotateZ(60deg);
      transform-origin: bottom;
      z-index: 1;
    }

    &__logo {
      position: absolute;
      top: 28%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Overpass', sans-serif;
      font-size: 18px;
      color: #464646;
      letter-spacing: 0.1rem;
      z-index: 0;
      user-select: none;
    }

    &__title {
      position: absolute;
      top: 65%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Overpass', sans-serif;
      font-size: 16px;
      font-style: italic;
      color: #fff;
      background: #1800ff;
      padding: 2px 6px 2px 4px;
      border-radius: 1px;
      z-index: 0;
      user-select: none;
    }

  }
  $angle: 30deg;

  .hour {
      position: absolute;
      top: 0px;
      left: 50%;
      display: block;
      width: 32px;
      height: 50%;
      margin-left: -18px;
      padding-top: 8px;
      font-family: 'Overpass', sans-serif;
      letter-spacing: -0.2rem;
      font-size: 38px;
      font-weight: 700;
      transform-origin: bottom;
      user-select: none;
      box-sizing: border-box;
      z-index: -1;
      span {
          display: block;
           i {
              display: block;
              font-style: normal;
          }
      }
  }
  @for $i from 2 through 12 {
      .hour:nth-of-type(#{$i}) {
          transform: rotatez(#{$angle * ($i - 1)});
          > span {
              transform: rotatez(#{-$angle * ($i - 1)});
          }
      }
  }
</style>