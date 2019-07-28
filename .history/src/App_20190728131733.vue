<template>
  <div id="app">
    {{this.$store.state.a}}aaa
    <br />
    <span>获得b的值:{{$store.getters.getB}}</span>
    <br />
    <button @click="increment">a的值++</button>
  </div>
</template>

<script>
export default {
  name: "app",
  methods: {
    increment() {
      this.$store.commit("increment", 10);
    }
  }
};
</script>

<style>
#app {
  margin: 100px auto;
  text-align: center;
}
</style>
