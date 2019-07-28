<template>
  <div id="app">{{$store.state.a}}aaa</div>
</template>

<script>
export default {
  name: "app",
  components: {},
  created() {
    console.log(this.$store);
  }
};
</script>

<style>
#app {
  margin: 100px auto;
  text-align: center;
}
</style>
