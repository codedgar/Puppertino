function Puppertino(options, selector){
    return {
        options: options,
        selector: selector,
        modal: function(selector) {
            console.log('AAAAAAAA');

            this.init = function(){
                console.log('huh');
            }
            this.show = function(selector){
                console.log(document.querySelector(selector));
            }
            this.hide = function(selector){
                console.log(document.querySelector(selector));
            }
            this.toggle = function(selector){
                console.log(document.querySelector(selector));
            }
            return this
        }
    }
}

options = {
    'modal': {
        'selector': 'try'
    }
}

const robo1 = Puppertino().modal().show('body');

