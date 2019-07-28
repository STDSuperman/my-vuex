<template>
  <div id="app">
    {{this.$store.state.a}}aaa
    <button @click="$store.getters.b">获得b的值</button>
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
