// Originally built by Yo.
// Modified by Bilawal Hameed

var Session = Backbone.Model.extend({
  initialize: function() {
     localStorage.getItem("com.yo.token") === null ? this.set("loggedIn", false) : this.set("loggedIn", true);

     this.on("destroy", function() {
        localStorage.removeItem("com.yo.token");
        localStorage.removeItem("com.yo.contacts");
        this.trigger("loggedOut");
     }, this);
  },
  
  login: function(a, b, c) {
     this.requestToken(a, function(a) {
        localStorage.setItem("com.yo.token", a), this.trigger("loggedIn"), b()
     }.bind(this), c)
  },

  requestToken: function(a, b, c) {
     $.ajax("https://api.justyo.co/rpc/login", {
        type: "POST",
        data: JSON.stringify(a),
        contentType: "application/json"
     }).success(function(a) {
        b(a.tok)
     }).fail(function() {
        console.error("Yo for Chrome: User's credentials not valid.");
     })
  }
});

var Contact = Backbone.Model.extend({
  sendYo: function(a, b) {
    var c = this;
    var e = localStorage.getItem("com.yo.token");

    window.getLatestLocation();

    $.ajax({
       type: "POST",
       url: "https://api.justyo.co/rpc/yo",
       contentType: "application/json",
       headers: {
          Authorization: "Bearer " + e
       },
       data: JSON.stringify({
          to: c.get("name")
       })
    }).success(function() {
       a()
    }).fail(function(a) {
       b(a)
    });
  },
  sendYoLink: function(a, b) {
     var c = this;

     window.getLatestLocation();

     chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
     }, function(d) {
        var e = localStorage.getItem("com.yo.token");
        $.ajax({
           type: "POST",
           url: "https://api.justyo.co/rpc/yo",
           contentType: "application/json",
           headers: {
              Authorization: "Bearer " + e
           },
           data: JSON.stringify({
              to: c.get("name"),
              link: d[0].url
           })
        }).success(function() {
           a()
        }).fail(function(a) {
           b(a)
        })
     })
  },
  sendYoLocation: function(a, b) {
    var c = this;
    var e = localStorage.getItem("com.yo.token");
    var ll = window.currentLocation;

    window.getLatestLocation();

    if(ll === null) {
      b(a);
      return;
    }

    $.ajax({
       type: "POST",
       url: "https://api.justyo.co/rpc/yo",
       contentType: "application/json",
       headers: {
          Authorization: "Bearer " + e
       },
       data: JSON.stringify({
          to: c.get("name"),
          location: ll
       })
    }).success(function() {
       a()
    }).fail(function(a) {
       b(a)
    });
  },
  sendYoDetect: function(m, a, b) {
    if(m === true) {
      return this.sendYoLink(a, b);
    } else {
      return this.sendYo(a, b);
    }
  },
});

var Contacts = Backbone.Collection.extend({
  model: Contact,
  initialize: function() {
     if (localStorage.getItem("com.yo.contacts")) {
        var a = JSON.parse(localStorage.getItem("com.yo.contacts"));
        this.populateContacts(a);
     }

     this.requestContacts(function(a) {
        this.updateLocalStorage(a);
        this.populateContacts(a);
     }.bind(this));

     this.on("contact:updateLocalStorage", function() {
        var a = JSON.parse(localStorage.getItem("com.yo.contacts"));
        localStorage.setItem("com.yo.contacts", JSON.stringify(a));
     });

     this.on("contact:reorder", function() {
        this.trigger("rerender");
     });

     this.on("remove", function(a) {
        this.removeContactFromLocalStorage(a);
     });
  },
  requestContacts: function(a) {
     var b = localStorage.getItem("com.yo.token");

     $.ajax("http://newapi.justyo.co/rpc/get_contacts", {
        type: "POST",
        contentType: "application/json",
        headers: {
           Authorization: "Bearer " + b
        }
     }).done(function(b) {
        a(b.contacts);
     }.bind(this)).fail(function() {
        console.error("Yo for Chrome: User's contacts could not be retrieved.")
     })
  },
  updateLocalStorage: function(a) {
     for (var b = this.parseLocalStorage(), c = 0; c < a.length; c++) - 1 === b.indexOf(a[c]) && b.push(a[c]);
     localStorage.setItem("com.yo.contacts", JSON.stringify(b))
  },
  populateContacts: function(a) {
     for (var b = 0; b < a.length; b++) this.findWhere({
        name: a[b]
     }) || this.add(new Contact({
        name: a[b]
     }));
     this.trigger("contacts:loaded");
  },
  repopulateContacts: function() {
    var a = JSON.parse(localStorage.getItem("com.yo.contacts"));
    var b = [];
    var c = window.toTheTop;

    if(c !== null) {
      b.push(c);

      for(d in a) {
        if(a[d] !== c) { b.push(a[d]); }
      }

      window.toTheTop = null;
      localStorage.setItem("com.yo.contacts", JSON.stringify(b));

      this.reset();
      this.populateContacts(b);
    }

    this.trigger("contacts:loaded");
  },
  parseLocalStorage: function() {
     var a;
     return a = localStorage.getItem("com.yo.contacts") ? JSON.parse(localStorage.getItem("com.yo.contacts")) : []
  },
  removeContactFromLocalStorage: function(a) {
     var b = this.parseLocalStorage(),
        c = b.indexOf(a.get("name"));
     b.splice(c, 1), localStorage.setItem("com.yo.contacts", JSON.stringify(b))
  }
});

var AddContact = Backbone.Model.extend({
  requestAddContact: function(a) {
     var b = localStorage.getItem("com.yo.token");
     $.ajax("http://newapi.justyo.co/rpc/add", {
        type: "POST",
        contentType: "application/json",
        headers: {
           Authorization: "Bearer " + b
        },
        data: JSON.stringify({
           username: a
        })
     }).done(function() {}).fail(function() {})
  }
});

var HamburgerView = Backbone.View.extend({
  className: "hamburger",
  events: {
     click: "handleClick"
  },
  template: _.template('<div class="inner alizarin"><img src="images/logout.png" class="hamburger-sign-out"></div>'),
  render: function() {
     return this.$el.html(this.template()), this.$el
  },
  handleClick: function() {
     this.model.destroy()
  }
});

var alizarin = "#e74c3c";
var yoColors = {
  turquoise: "#1ABC9C",
  emerald: "#2ECC71",
  peter: "#3498DB",
  asphalt: "#34495E",
  green: "#16A085",
  sunflower: "#F1C40F",
  belize: "#2980B9",
  wisteria: "#8E44AD",
  alizarin: "#e74c3c",
  amethyst: "#9B59B6"
};

var ContactView = Backbone.View.extend({
  tagName: "li",
  events: {
     mousedown: "handleMouseDown",
     mouseup: "handleMouseUp",
     click: "handleClick",
     dblclick: "handleDoubleClick"
  },
  template: _.template('<div class="contact-profile swipe-screen"><span class="contact-profile-image"><img src="/images/profileedit.png" /></span><span class="contact-profile-name"><strong><%= name %></strong></span></div><a class="contact-name swipe-screen"><%= name %></a><ul class="contact-details swipe-screen"><li class="wisteria">CANCEL</li><li class="belize">DELETE</li><li class="alizarin">BLOCK</li></ul>'),
  initialize: function() {
    this.timer = null;
    this.delay = 500;
    this.swipedIndex = 2;
    this.dragging = false;
    this.draggingStill = -1;
  },
  swipe: function(current, index) {
    var margins = [0, 0, 0];
    var b = this;

    this.$el.find('.swipe-screen').css('display', 'none');
    this.$el.find('.swipe-screen:eq('+(current-1)+')').css('display', 'inline-block');
    this.$el.find('.swipe-screen:eq('+(index-1)+')').css('display', 'inline-block');

    this.$el.css({ 'margin-left': margins[index-1] });
    this.$el.find('.swipe-screen:eq('+(index-1)+')').siblings().css('display', 'none');
  },
  onShow: function(index) {
    console.log("showing " + index);
  },
  render: function() {
    var b = this;
    b.$el.html(b.template(b.model.attributes));

    b.$el.find(".swipe-screen").drag(function(ev, dd){
      var d = dd.deltaX;
      d = (d < -250) ? -250 : d;
      d = (d > 250) ? 250 : d;

      $(this).css('left', d);

      this.draggingStill = -1;
    });

    b.$el.find(".swipe-screen.contact-name").focus(function(e){
      console.log("hi world");
    }).focusout(function(e){
      console.log("bye world");
    });

    b.$el.find(".swipe-screen").drag("start", function(ev, dd) {
      b.dragging = true;
      if($(this).hasClass('contact-name'))
      {
        // fake yolink
        var _interval, c = this;
        c.draggingStill = 0;

        _interval = setInterval(function(){
          if(c.draggingStill >= 0) {
            c.draggingStill += 10;

            console.log(c.draggingStill);

            if(c.draggingStill > 100) {
              console.log("send yolink");
              clearInterval(_interval);
            }
          } else {
            clearInterval(_interval);
          }
        }, 10);
      }
    });

    b.$el.find(".swipe-screen").drag("end", function(ev, dd) {
      b.dragging = false;

      $(this).css('left', 0);

      if(dd.deltaX < -175) { b.swipe(b.swipedIndex, b.swipedIndex >= 3 ? 3 : ++b.swipedIndex); }
      if(dd.deltaX > 175) { b.swipe(b.swipedIndex, b.swipedIndex <= 1 ? 1 : --b.swipedIndex); }
    });

    b.$el.find(".swipe-screen.contact-details li:eq(0)").click(function(e){
      e.preventDefault();
      b.swipe(b.swipedIndex, b.swipedIndex <= 1 ? 1 : --b.swipedIndex);
    });

    return b.$el;
  },
  handleMouseDown: function(a) {
     if(this.dragging === true) { return; }
     if($(a.target).hasClass('contact-name') === false) { return; }

     var b = this;
     if (1 !== a.which || "CANCELED" === b.$el.find(".contact-name").text()) return !1;
     b.initialTime = Date.now(), b.percentLoaded = 0;
     var c = b.$el.attr("class").toString().split(" ")[1],
        d = (yoColors[c], !1);
     b.updateLoop = setInterval(function() {
        var a = Date.now();
        if (b.elapsed = a - b.initialTime, b.elapsed > 300) {
           b.percentLoaded = Math.min(Math.round(100 * (b.percentLoaded + .59)) / 100, 100), b.$el.removeClass("long").find(".contact-name").text("SENDING LINK");
           var c = 100 - b.percentLoaded + "% " + b.percentLoaded + "%";
           b.$el.css("background-position", c), b.percentLoaded >= 100 && (clearInterval(b.updateLoop), d || (b.initiateYo({
              longPress: !0
           }), d = !0))
        }
     }, 10)
  },
  handleMouseUp: function(a) {
     if(this.dragging === true) { return; }
     if($(a.target).hasClass('contact-name') === false) { return; }

     clearInterval(this.updateLoop), void 0 === this.elapsed || this.elapsed < 300 ? null : this.percentLoaded < 100 && (this.$el.css("background-position", "100% 0%"), this.$el.removeClass("long").find("span").text("CANCELED"), setTimeout(function() {
        
        this.model.trigger("rerender")
     }.bind(this), 2e3))
  },
  handleClick: function(a) {
    if(this.dragging === true) { return; }
    if($(a.target).hasClass('contact-name') === false) { return; }
    
    if(this.timer !== null) {
      clearInterval(this.timer);
    }

    var b = this;
    this.timer = setTimeout(function(){
      b.initiateYo({ longPress: false });
    }, this.delay);
  },
  handleDoubleClick: function(a) {
    if(this.dragging === true) { return; }
     if($(a.target).hasClass('contact-name') === false) { return; }
    if(this.timer !== null) {
      clearInterval(this.timer);
    }

    if(window.currentLocation !== null) {
      this.initiateYoLocation();
    } else {
      this.handleMouseUp();
    }
  },
  initiateYo: function(a) {
     var b = this;
     var c = b.$el.attr("class").toString().split(" ")[1];
     var e = $("<div>").css({ 'width': '100%' })
     var d = $("<img>");

     a.longPress ? d.attr("src", "images/spiffygif_alizarin_60x60.gif") : d.attr("src", "images/spiffygif_" + c + "_60x60.gif");
     b.$el.find("a.contact-name").html(e.html(d));

     window.toTheTop = b.model.get("name");

     b.model.sendYoDetect(a.longPress || false, function() {
      b.$el.removeClass("long");
      b.$el.removeClass("extra-long");
      b.$el.find("span.contact-name").text(a.longPress === true ? "SENT YOLINK!" : "SENT YO!").before("<strong>").after("</strong>");
      b.$el.height();
      $(".yo-contact").index(b.$el) * b.$el.height();
      b.model.trigger("contact:updateLocalStorage", b.model);

      setTimeout(function() {
        b.model.trigger("contact:reorder", b.model);
        contacts.repopulateContacts();
        $(".contact-list").scrollTop(0);
      }, 2e3);

     }, function(a) {
      if(parseInt(a.getResponseHeader("X-Ratelimit-Remaining")) === 0) { return b.$el.html($("<span>").html("FAILED").addClass("contact-name flashtext long")); }
      b.model.trigger("rerenderInTwoSeconds"), void 0 !== a.responseJSON && "No user found" === a.responseJSON.error ? (b.$el.html($("<span>").html("NO SUCH USER").addClass("contact-name flashtext")), b.$el.addClass("long"), b.$el.removeClass("extra-long"), b.model.trigger("removeContact", b.model)) : (b.$el.html($("<span>").text("FAILED").addClass("contact-name flashtext")), b.$el.addClass("long"))
     })
  },
  initiateYoLocation: function(a) {
     var b = this;
     var c = b.$el.attr("class").toString().split(" ")[1];
     var e = $("<div>").css('width', '100%').css('margin-top', '-12px');
     var d = $("<img>").attr("src", "images/spiffygif_" + c + "_60x60.gif");

     return console.log("disabled location");

     window.toTheTop = b.model.get("name");

     b.$el.find("span.contact-name").html(e.html(d)).before("<strong>").after("</strong>");

     b.model.sendYoLocation(function() {
      b.$el.removeClass("long");
      b.$el.removeClass("extra-long");
      b.$el.find("span.contact-name").text("SENT @YO!").before("<strong>").after("</strong>");
      b.$el.height();
      $(".yo-contact").index(b.$el) * b.$el.height();
      b.model.trigger("contact:updateLocalStorage", b.model);

      setTimeout(function() {
        b.model.trigger("contact:reorder", b.model);
        contacts.repopulateContacts();
        $(".contact-list").scrollTop(0);
      }, 2e3);

     }, function(a) {
      if(parseInt(a.getResponseHeader("X-Ratelimit-Remaining")) === 0) { return b.$el.html($("<span>").html("FAILED").addClass("contact-name flashtext long")); }
      b.model.trigger("rerenderInTwoSeconds"), void 0 !== a.responseJSON && "No user found" === a.responseJSON.error ? (b.$el.html($("<span>").html("NO SUCH USER").addClass("contact-name flashtext")), b.$el.addClass("long"), b.$el.removeClass("extra-long"), b.model.trigger("removeContact", b.model)) : (b.$el.html($("<span>").text("FAILED").addClass("contact-name flashtext")), b.$el.addClass("long"))
     });
  }
});

$.fn.textWidth = function() {
   var a = $(this).html(),
      b = "<span>" + a + "</span>";
   $(this).html(b);
   var c = $(this).find("span:first").width();
   return $(this).html(a), c
};

var ContactsView = Backbone.View.extend({
  el: "ul.contact-list",
  className: "contacts-view contact-list",
  initialize: function() {
     this.render(), this.listenTo(this.model, "contacts:loaded", this.render), this.listenTo(this.model, "rerender", this.render), this.listenTo(this.model, "rerenderInTwoSeconds", this.renderInTwoSeconds)
  },
  renderInTwoSeconds: function() {
     setTimeout(function() {
        this.render()
     }.bind(this), 2e3)
  },
  render: function() {
     var a = this;
     var i = 0;
     a.$el.html(""), a.model.forEach(function(b, c) {
        var d = new ContactView({ model: b });
        a.$el.append(d.render().addClass("yo-contact").addClass(orderedColors[c % orderedColors.length]))
        i++;
     }, a);

     i++;
     a.$el.append(yoIndex.render().addClass(orderedColors[i % orderedColors.length]).css('margin-left', '0px'));

     i++;
     var b = orderedColors[(i + this.model.length) % orderedColors.length];
     addContact.set("color", b), a.$el.append(new AddContactView({
        model: addContact
     }).render());

     a.$el.append(new HamburgerView({
        model: session
     }).render());

     $(".contact-list").find("a.contact-name").each(function() {
        var b = function() {
           var a = parseInt($(this).css("font-size")),
              b = $(this).height();
           return b / a
        };
        $(this).textWidth() > 260 && $(this).parent().addClass("long");
        var c = b.call(this);
        c > 2 && ($(this).parent().removeClass("long"), $(this).parent().addClass("extra-long")), c = b.call(this);
        var d = $(this).text(),
           e = a.model.findWhere({
              name: d
           });
        if (3 >= c) e.set("displayName", d), e.set("truncate", !1);
        else {
           var f, g, h = d.indexOf("From");
           for (h >= 0 ? (f = d.slice(0, h), g = d.slice(h, d.length)) : (f = d.slice(0, d.length - 10), g = d.slice(d.length - 10, d.length)); c > 3;) {
              c = b.call(this), f = c > 4 ? f.slice(0, f.length - 10) : f.slice(0, f.length - 1);
              var i = f + "..." + g;
              $(this).text(i)
           }
           void 0 === e.get("displayName") ? e.set("displayName", i) : e.get("displayName").length < i.length ? $(this).text(e.get("displayName")) : e.set("displayName", i)
        }
     })
  }
});

var orderedColors = ["turquoise", "emerald", "peter", "asphalt", "green", "sunflower", "belize", "wisteria"];


var LoginView = Backbone.View.extend({
  el: "div.login-view",
  className: "login-view",
  events: {
     "submit form": "handleFormSubmit",
     "keydown .username": "keydownUsername",
     "keydown .passcode": "keydownPasscode"
  },
  template: _.template('<form>\n<input type="text" name="username" placeholder="USERNAME" value="" class="turquoise login-view-item username">\n<input type="password" name="password" placeholder="PASSCODE" value="" class="emerald login-view-item passcode">\n<input type="submit" value="TAP TO LOGIN" class="peter login-view-item submit">\n</form>'),
  render: function() {  
     return this.$el.html(this.template()), this.$el;
  },
  handleFormSubmit: function(a) {
     var b = this;
     a.preventDefault();

     var username = b.$el.find("input[name=username]").val().toUpperCase();
     var password = b.$el.find("input[name=password]").val();

     if(username.length === 0 || password.length === 0) {
       b.$el.find("input:last").val("FAILED").addClass("flashtext").show(0).delay(2500).queue(function(){
         $(this).stop().removeClass("flashtext").val("TAP TO LOGIN");
       });
       return;
     }

     var c = $("<img>").attr("src", "images/spiffygif_peter_60x60.gif").addClass("spiffy-gif");
     b.$el.find("input:last").hide();
     b.$el.find("form").append($("<div>").addClass("login-view-item peter").html(c));

     b.model.login({
        username: username,
        password: password
     }, function(){}, function() {
        b.$el.find(".spiffy-gif").parent("div.peter.login-view-item").detach();
        b.$el.find("input:last").val("FAILED").addClass("flashtext").show(0).delay(2500).queue(function(){
          $(this).stop().removeClass("flashtext").val("TAP TO LOGIN");
        });
     })
  },
  keydownUsername: function() {
     var a = this.$el.find(".username");
     setTimeout(function() {
        a.val().length > 0 ? (a.css("text-align", "center"), a.css("padding-left", "0")) : (a.css("text-align", "left"), a.css("padding-left", "40px"));
        var b = Math.max(30 - (Math.max(a.val().length, 10) - 10), 16);
        a.css("font-size", b + "px")
        a.css("width", 260 - parseInt(a.css("padding-left")));
     }, 0)
  },
  keydownPasscode: function() {
     var a = this.$el.find(".passcode");
     setTimeout(function() {
        a.val().length > 0 ? (a.css("text-align", "center"), a.css("padding-left", "0")) : (a.css("text-align", "left"), a.css("padding-left", "45px"))
        a.css("width", 260 - parseInt(a.css("padding-left")));
     }, 0)
  }
});

var YoIndex = Backbone.View.extend({
  tagName: "li",
  className: "yo-contact yo-index",
  render: function() {
    return this.$el.html("<a href='http://www.yoindex.com/' target='_blank' class='contact-name'>INDEX</a>");
  }
});

var AddContactView = Backbone.View.extend({
  tagName: "li",
  className: "add-contact-view",
  events: {
     click: "handleClick",
     "submit form": "handleFormSubmit",
     keydown: "validateInput",
     "paste input": "validateInput"
  },
  staticTemplate: _.template('<div class="add-contact-input plus-sign">+</div>'),
  formTemplate: _.template('<form>\n<input type="text" name="username" placeholder="+" class="add-contact-input" autofocus>\n</form>'),
  render: function() {
     return this.$el.html(this.staticTemplate()), this.$el.find("div").addClass(this.model.get("color")), this.model.set("clicked", !1), this.$el
  },
  handleClick: function() {
     this.model.get("clicked") || (this.$el.html(this.formTemplate()), this.$el.find("input").addClass(this.model.get("color")), this.model.set("clicked", !0));
     var a = this.$el.find("input");
     a.trigger("focus"), 0 === a.val().length && (a.css("text-align", "left"), a.attr("placeholder", "TYPE USERNAME TO ADD"), a.css("font-size", "18px"), a.css("padding-left", "12px"), this.$el.parent().find(".hamburger").hide())
  },
  validateInput: function() {
     var a = this.$el.find("input");
     setTimeout(function() {
        if (a.val(a.val().replace(/[^\w\s\+]/gi, "")), a.val().length > 0) {
           a.css("text-align", "center"), a.css("padding-left", "0");
           var b = Math.max(30 - (Math.max(a.val().length, 10) - 10), 16);
           a.css("font-size", b + "px")
        } else a.css("text-align", "left"), a.css("font-size", "18px"), a.css("padding-left", "12px")
     }, 0)
  },
  handleFormSubmit: function(a) {
     a.preventDefault();
     var b = this.$el.find("input").val().toUpperCase();
     this.model.trigger("newContact", b), this.model.requestAddContact(b)
  }
});

var session = new Session;
var addContact = new AddContact;
var yoIndex = new YoIndex();
var loginView = new LoginView({
  model: session
});

loginView.render(), loginView.$el.hide();

var contacts, contactsView;
$(function() {
   var a = function() {
     contacts = new Contacts, contacts.on("removeContact", function(a) {
        contacts.remove(a)
     });

     contactsView = new ContactsView({
        model: contacts
     });

     $(".login-view").hide();
     $(".contact-list").show();
  };

  var b = function() {
     loginView.render(), $(".login-view").show(), $(".contact-list").hide(), $(".contact-list").html("")
  };

  session.get("loggedIn") ? a() : b();
  session.on("loggedIn", function() { a(); });
  session.on("loggedOut", function() { b(); });

  addContact.on("newContact", function(a) {
    contacts.add(new Contact({
      name: a
    }));

    contacts.updateLocalStorage([a]);
    contacts.trigger("rerender");
    contacts.trigger("scrollDownToBottom");
  })
});

// Get user's location
window.currentLocation = null;
window.toTheTop = null;

window.getLatestLocation = function(){
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position){
      window.currentLocation = [position.coords.latitude, position.coords.longitude].join(";");
    });
  }
};

$(document).keydown(function(e){
  if(e.keyCode === 27) {
    e.preventDefault();

    $(".contact-list > li").each(function(){
      if($(this).find('.contact-name').is(':visible') === false) {
        $(this).find('.swipe-screen').css('display', 'none');
        $(this).find('.swipe-screen.contact-name').css('display', 'inline-block');
      }
    });
  }
});

window.getLatestLocation();