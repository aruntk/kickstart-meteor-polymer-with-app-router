class TestElement extends Polymer.Element {
  static get is() {
    return 'test-element';
  }
  static get properties() {
    return {
      name: {
        type: String,
        value: 'Arun Kumar',
      },
      nickname: {
        type: String,
        value: 'tkay',
      },
      show: {
        type:String,
        value: 'show',
      },
      nndHidden: {
        type: Boolean,
        value: true,
      },
    };
  }
  showNickName(){
    this.nndHidden = !this.nndHidden;
    this.show = this.nndHidden ? "show" : "hide";
  }
};
window.customElements.define(TestElement.is, TestElement);

