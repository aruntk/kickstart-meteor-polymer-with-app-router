import { MwcMixin } from 'meteor/mwc:mixin';

class TestLayout extends MwcMixin(Polymer.Element) {
  static get is() {
    return 'test-layout';
  }
  static get properties() {
    return {
      route: Object,
      routeData: {
        type: Object,
        value: function() {
          return {
            page: '',
          };
        },
      },
      appState: {
        type: String,
      },
      notCordova: Boolean,
    };
  }
  get trackers() {
    return ['changeStatus(routeData.page)'];
  }
  changeStatus(page){
    this.set("appState",`Page : ${page || 'home'} , Status : ${Meteor.status().status}`);
    if(!Meteor.isCordova){
      this.notCordova = true;
    }
  }
  second(){
    this.set("routeData.page", "second"); 
  }
  home(){
    this.set("routeData.page", ""); 
  }
};

window.customElements.define(TestLayout.is, TestLayout);
