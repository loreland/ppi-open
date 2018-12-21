var Storage = sessionStorage || localStorage || {};

var Home = Vue.component('home',{
  data: function() {
    return {
      storage: {h:Storage.ideaStorageH||'', p:Storage.ideaStorageP||''}
    }
  },
  template: '#content-home',
  methods: {
    changeLayout: function(v) {
      this.$store.commit('changeLayout',{storage:!0,value:v});
    }
  }
});

var Idea = Vue.component('idea',{
  data: function() {
    return {
      storage: {h:Storage.ideaStorageH||'', p:Storage.ideaStorageP||''},
      editable: false,
      showHelp: false,
      showHelpMessage: false,
      delayShowHelp: 7000,
      hndHelp: 0,
      hndChart: 0,
      tokensAtDivvy: 15000,
      divvy: Storage.ideaDivvy?Number(Storage.ideaDivvy):5,
      taskList: [],
      showTaskList: false
    }
  },
  template: '#content-idea',
  created: function(){
    var t = this;
    t.getTaskList();
    t.$parent.$emit('afterCreated',t);
  },
  mounted: function() {
    var t = this;
    t.hndChart = setInterval(function(){
      if(!t.$parent.chart)return;
      clearInterval(t.hndChart);
      t.$parent.chart.dataProvider = [{value:t.tokensAtDivvy*t.divvy},{value:t.tokensAtDivvy*100-t.tokensAtDivvy*t.divvy}];
      t.$parent.chart.valueField = 'value';
      with(t.$parent.chart){
        colors = ['#9f82ed','#f07fa9'];
        gradientType = 'radial';
        gradientRatio = [0,-0.1];
        outlineColor = 'transparent';
        outlineAlpha = 0.8;
        outlineThickness = 2;
        balloonText = '<span style="font-size:14px"><b>[[value]]</b> ([[percents]]%)</span>';
        depth3D = 14;
        angle = 55;
        startAngle = 270;
        labelsEnabled = false;
        marginTop = 0;
        marginBottom = 0;
      }
      t.$parent.chart.write('chartarea');
    },150);
    t.hndHelp = setTimeout(t.help,t.delayShowHelp);
  },
  beforeDestroy: function() {
    if(this.$parent.chart)this.$parent.chart.clear();
  },
  methods: {
    incdec: function(v) {
      var t = this;
      clearTimeout(t.hndHelp);
      t.showHelp = false;
      t.divvy += v;
      if (t.divvy<1) t.divvy = 1;
      if (t.divvy>50) t.divvy = 50;
      t.$parent.chart.dataProvider = [{value:t.tokensAtDivvy*t.divvy},{value:t.tokensAtDivvy*100-t.tokensAtDivvy*t.divvy}];
      t.$parent.chart.validateData();
      Storage.ideaDivvy=t.divvy;
      t.hndHelp=setTimeout(t.help,t.delayShowHelp);
    },
    edit: function(e) {
      var t = this, h = e.target.parentNode.getElementsByTagName('h2')[0], p = e.target.parentNode.getElementsByTagName('p')[0], range;
      clearTimeout(t.hndHelp);
      t.showHelp = false;
      if(h.getAttribute('contenteditable')){
        h.removeAttribute('contenteditable');
        p.removeAttribute('contenteditable');
        t.editable = false;
        if (window.getSelection) window.getSelection().removeAllRanges();
        if(h.innerText.replace(/\s+/g,'')=='')h.innerText=t.storage.h;
        if(p.innerText.replace(/\s+/g,'')=='')p.innerText=t.storage.p;
        if(t.storage.h!=h.innerText||t.storage.p!=p.innerText){
          Storage.ideaStorageH=h.innerText;
          Storage.ideaStorageP=p.innerText;
          axios.post('',{header:h.innerText,text:p.innerText}).then(function(resp){
            console.log('save OK');
          });
        }
        t.hndHelp = setTimeout(t.help,t.delayShowHelp);
      } else {
        t.storage.h = h.innerText;
        h.setAttribute('contenteditable',true);
        t.storage.p = p.innerText;
        p.setAttribute('contenteditable',true);
        t.editable = true;
        if (document.body.createTextRange) {
          range = document.body.createTextRange();
          range.moveToElementText(h);
          range.select();
        } else if (window.getSelection) {
          var selection = window.getSelection();
          range = document.createRange();
          range.selectNodeContents(h);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    },
    submit: function(e) {
      var t = this;
      clearTimeout(t.hndHelp);
      t.showHelp = false;
      t.showTaskList = !t.showTaskList;
      if(t.showTaskList){
        axios.post('',{}).then(function(resp){
          console.log('submit OK');
        });
      } else t.hndHelp=setTimeout(t.help,t.delayShowHelp);
    },
    getTaskList: function() {
      var t = this;
      axios.get('').then(function(resp){
        t.taskList.push({title:'123'});
        t.taskList.push({title:'34786'});
      });
    },
    help: function() {
      this.showHelpMessage = false;
      this.showHelp = true;
    }
  },
  computed: {

  }
});

var plgIntoStorage = function (store) {
  // called when the store is initialized
  if (Storage.storage) {
    if (JSON.parse(Storage.storage).updateTime && JSON.parse(Storage.storage).updateTime<Math.floor((new Date()).getTime()/1000)-86400*10) Storage.removeItem('storage');
    else store.commit('loadFromStorage');
  }

  store.subscribe( function(mutation, state) {
    // called after every mutation.
    // The mutation comes in the format of `{ type, payload }`.
    if (mutation.payload && mutation.payload.storage) {
      state.storage.updateTime = Math.floor((new Date()).getTime()/1000);
      Storage.storage = JSON.stringify(state.storage);
    }
  });
}

var app = new Vue({

  el: '#app',

  router: new VueRouter({
    mode: 'hash',
    routes:[
      {path: '/',	component: Home,	name: 'home'},
      {path: '/idea',	component: Idea,	name: 'idea'}
    ]
  }),

  store: new Vuex.Store({
    state: {
      storage: {
        updateTime: Math.floor((new Date()).getTime()/1000),
        layout: 1
      }
    },
    getters:{
      layout (state) {
        return state.storage.layout;
      }
    },
    mutations: {
      loadFromStorage (state) {
	if (Storage.storage && JSON.parse(Storage.storage)) state.storage = JSON.parse(Storage.storage);
      },
      changeLayout (state, payload) {
        state.storage.layout = payload.value;
      }
    },
    plugins: [plgIntoStorage]
  }),

  data: function(){
    return {
      chart: null
    };
  },

  created: function(){
    var t = this;
    AmCharts.ready(function(){
      t.chart = new AmCharts.AmPieChart();
    });
  }

});
