<template>
  <div id="app">
    {{this.$store.state.a}}
    <br />
    <span>获得b的值:{{$store.getters.getB}}</span>
    <br />
    <button @click="incrementSync">a的值++</button>
  </div>
</template>

<script>
export default {
  name: "app",
  methods: {
    incrementSync() {
      this.$store.commit("increment", 10);
    },
    decrementAsync() {
      this.$store.dispatch("decrement", 20);
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
