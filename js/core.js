var formTest = {
  layoutDfltOpts: {
    wrap: false
  },
  init: function() {

    this.initRouter();
    this.router.start();
  },
  initRouter: function() {
    var that = this;
    this.router = new kendo.Router({
        init: function() {
            that.layouts.setRootLayout();
            formTest.layouts.rootLayout.render("#application");
            that.layouts.getMenuLayout('one');
        }
    });
    this.router.route("/", function() {
        formTest.layouts.rootLayout.showIn("#content", formTest.layouts.getEmptyContent());
        $('#menu_inner .menu_item').removeClass('active');
    });
    this.router.route("/:form", function(form) {
      console.log('requested form:', form);
      formTest.layouts.getFormContent(form);
    });
  },
  layouts: {
    formsLayout: {},
    getFormContent: function(form) {
      if(!formTest.layouts.formsLayout[form]) {
      formTest.http.getForm(form, function(data) {
        console.log('got form def: ', data);

        $('#menu_inner .menu_item').removeClass('active');
        $("#menu_inner .menu_item>a[href='#/"+form+"']").parent().addClass('active');

        formTest.layouts.formsLayout[form]
          = new kendo.Layout('<h1>'+data.label+'</h1>',formTest.layoutDfltOpts); // here we have to build the form layout
        formTest.layouts.rootLayout.showIn("#content", formTest.layouts.formsLayout[form]);

      });
    },
    getErrorContent: function() {
      if(!formTest.layouts.errorLayout) {
        formTest.layouts.errorLayout = new kendo.Layout("<div id='content_inner'>\
          <h2>Uops, unkown error</h2>\
          </div>", formTest.layoutDfltOpts);
      }
      return formTest.layouts.errorLayout;
    },
    getEmptyContent: function() {
      if(!formTest.layouts.emptyLayout) {
        formTest.layouts.emptyLayout = new kendo.Layout("<div id='content_inner'>\
          <h1>Main Empty</h1>\
          </div>", formTest.layoutDfltOpts);
      }
      return formTest.layouts.emptyLayout;
    },
    setRootLayout: function() {
      if(!formTest.layouts.rootLayout) {
        formTest.layouts.rootLayout = new kendo.Layout("<div id='application_inner'>\
          <header id='menu_wrapper'></header>\
          <section id='content'></section>\
          <footer id='footer'>Footer</footer>\
          </div>", formTest.layoutDfltOpts);
      }
    },
    getMenuLayout: function(user) {

      formTest.http.getMenu(user, function(data) {
        console.log('Got menu', data);
        formTest.layouts.menuLayout = new kendo.Layout("<div id='menu_inner'>Menu</div>", formTest.layoutDfltOpts);

        var itemsLayout = new kendo.Layout('<ul class="main_menu"><li><a href="#/">Home</a></li></ul>',formTest.layoutDfltOpts);
        data.main_menu.forEach(function(item) {
          var menuItemModel = kendo.observable({
            openForm: function() {
              switch(item.type) {
                case 'GENERIC':

                  return '#/'+item.code;

                case 'LINK':
                  return item.url;

                  default:
                  console.error('unknown menu item type: %s', item.type);
              }
            }
          });
          var itemOpts = Object.assign({},formTest.layoutDfltOpts, {
            model: menuItemModel,
            evalTemplate: true
          });
          console.log('building item '+item.id);

          var itemLayout =
            new kendo.Layout('<li class="menu_item"><a data-bind="attr: {href: openForm }" id="menu_item_'+item.id+'">'+item.name+'</a></li>',itemOpts);
          itemsLayout.showIn('.main_menu',itemLayout); // <-- Here the problem, we need to append itemLayout into .main_menu, not replacing the current child
        })
        formTest.layouts.menuLayout.showIn('#menu_inner',itemsLayout);
        formTest.layouts.rootLayout.showIn('#menu_wrapper', formTest.layouts.menuLayout);
      })
    }
  },
  http: {
    getMenu: function(user, next) {
      $.getJSON('/api/menu/'+user+'.json', function( data ) {
        if(data.ret == 'OK') {
          next(data.data);
        } else {
          console.error('Uops... error loading menu');
        }
      });
    },
    getForm: function(form, next) {
      $.getJSON('/api/forms/'+form+'.json', function( data ) {
        if(data.ret == 'OK') {
          next(data.data);
        } else {
          console.error('Uops... error loading form');
        }
      }).fail(function() {
        console.error( "error" );
        formTest.layouts.rootLayout.showIn("#content", formTest.layouts.getErrorContent());
      });
    }
  }

};
