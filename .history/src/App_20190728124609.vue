<template>
  <div id="app">
    {{this.$store.state.a}}aaa
    <button>获得b的值:{{$store.getters.getB}}</button>
  </div>
</template>

<script>
export default {
  name: "app",
  components: {},
  created() {}
};
</script>

<style>
#app {
  margin: 100px auto;
  text-align: center;
}
</style>
