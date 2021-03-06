// Degrade the console obj where not present.
// ==========================================
// http://fbug.googlecode.com/svn/branches/firebug1.2/lite/firebugx.js
// Relaxed to allow for Chrome's console.

if (!window.console)
{
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir",
                 "dirxml", "group", "groupEnd", "time", "timeEnd", "count", 
                 "trace", "profile", "profileEnd"];
    window.console = {};
    for (var i=0, name; name = names[i]; i++)
        window.console[name] = function() {};
}


// Make sure we have some things.
// ==============================

$.fn.serializeObject = function()
{   // http://stackoverflow.com/questions/763345/jquery-how-to-store-form-values-in-data-object
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

if (!Array.prototype.indexOf)
{   // http://stackoverflow.com/questions/1744310/how-to-fix-array-indexof-in-javascript-for-ie-browsers
    Array.prototype.indexOf = function(obj, start)
    {
         for (var i = (start || 0), j = this.length; i < j; i++)
             if (this[i] == obj)
                return i;
         return -1;
    }
}

if (!String.prototype.replaceAll)
{
    String.prototype.replaceAll = function(p, r)
    {
        var s = this;
        while (s.indexOf(p) !== -1)
            s = s.replace(p, r);
        return s;
    }
}

if(!String.prototype.trim)
{   // http://stackoverflow.com/questions/1418050/string-strip-for-javascript
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

if(!Array.prototype.remove)
{   //http://ejohn.org/blog/javascript-array-remove/
    Array.prototype.remove = function(from, to)
    {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    }
};


// Main namespace.
// ===============

IHAM = {};

IHAM.disabled = false;

IHAM.getScrollbarWidth = function()
{   // https://github.com/brandonaaron/jquery-getscrollbarwidth

    /*! Copyright (c) 2008 Brandon Aaron (brandon.aaron@gmail.com ||
     * http://brandonaaron.net) Dual licensed under the MIT
     * (http://www.opensource.org/licenses/mit-license.php) and GPL
     * (http://www.opensource.org/licenses/gpl-license.php) licenses.
     */

    var scrollbarWidth;
    if ( $.browser.msie ) {
        var $textarea1 = $('<textarea cols="10" rows="2"></textarea>')
                .css({ position: 'absolute', top: -1000, left: -1000 }).appendTo('body'),
            $textarea2 = $('<textarea cols="10" rows="2" style="overflow: hidden;"></textarea>')
                .css({ position: 'absolute', top: -1000, left: -1000 }).appendTo('body');
        scrollbarWidth = $textarea1.width() - $textarea2.width();
        $textarea1.add($textarea2).remove();
    } else {
        var $div = $('<div />')
            .css({ width: 100, height: 100, overflow: 'auto', position: 'absolute', top: -1000, left: -1000 })
            .prependTo('body').append('<div />').find('div')
                .css({ width: '100%', height: 200 });
        scrollbarWidth = 100 - $div.width();
        $div.parent().remove();
    }
    return scrollbarWidth;
};

IHAM.resize = function()
{   // The heads have a fixed height, the stubs a fixed width. Everything else
    // is calculated based on that.
    
    var WIN = $(window);

    var detailsHeight = WIN.height() - 10;
        detailsHeight = detailsHeight - (detailsHeight % 14);
    var detailsWidth = 400;

    var halfish = Math.floor(WIN.width() / 2);
    if (halfish > detailsWidth)
    {
        $('#details').css({'left': halfish - detailsWidth + 5, 'top': 5});
        $('#summary').css({'left': halfish + IHAM.scrollbarWidth, 'top': 5});
    }
    else
    {
        $('#details').css({'left': 5, 'top': 5});
        $('#summary').css({'left': detailsWidth + 5 + 5, 'top': 5});
    }

    $('#details').width(detailsWidth)
                 .height(detailsHeight);

};


// Balance
// =======

IHAM.setBalance = function(balance)
{
    $('#summary TD.amount B').eq(-1).html(IHAM.commaize(balance))
};

IHAM.updateBalance = function(e)
{
    if (IHAM.disabled) return false;
    var balance = prompt("What is your balance?");
    if (!balance)
        return;
    balance = parseFloat(balance, 10);
    if (isNaN(balance))
    {
        alert("Bad balance!")
        return;
    }
    balance = parseFloat(balance.toFixed(2), 10); // round to 2 decimals
    IHAM.setBalance(balance); // Let's be optimistic ... and snappy!
    if (balance !== null)
        jQuery.ajax({ type: "POST"
                    , url: "/set-balance.json"
                    , data: {'balance': balance}
                    , success: function(d) { 
                        if (balance != d.balance) 
                            alert( "Weird balance discrepancy: " 
                                 + balance.toString() + " vs. "
                                 + d.balance.toString() + "."
                                  );
                      }
                    , error: function(a,b,c) { alert('Bad balance!') }
                    , dataType: 'json'
                     })
};


/* Categories */
/* ========== */

IHAM.reload = function()
{
    IHAM.spin();
    window.location.reload();
};

IHAM.createCategory = function(e)
{
    if (IHAM.disabled) return false;
    var category = prompt("Name your category!");
    if (category !== null)
        jQuery.ajax({ type: "POST"
                    , url: "/categories/" + encodeURIComponent(category) + "/"
                    , success: IHAM.reload
                    , dataType: 'json'
                     })
};

IHAM.deleteCategory = function(e)
{
    if (IHAM.disabled) return false;
    var cid = $('TR.current').attr('cid');
    if (cid === "-1")
        alert( "'Uncategorized' isn't technically a category, so you can't "
             + "delete it."
              );
    else
    {
        var category = $('TR.current TH').text().trim();
        if (confirm("Do you really want to delete '" + category + "'?"))
            jQuery.ajax({ type: "POST"
                        , url: "/categories/" 
                               + encodeURIComponent(category) 
                               + "/delete.json"
                        , success: IHAM.reload
                        , dataType: 'json'
                         });
    }
};

IHAM.toggleCategoryCreator = function()
{
    if (IHAM.disabled) return false;
    $('#top .widget').toggle()
    var cur = $('#top .knob').text();
    var next = 'create a category';
    if (cur == next)
    {
        $('#top INPUT').val('').focus();
        next = 'cancel';
    }
    $('#top .knob').text(next);
};

IHAM.categoryCreatorKeyup = function(e)
{
    if (IHAM.disabled) return false;
    switch (e.which)
    {
        case 27:
            IHAM.toggleCategoryCreator();
            break;
        case 13:
            IHAM.createCategory({"target": $('#top BUTTON').get(0)});
            break;
    }
};

IHAM.scrollVertically = function(num, fast)
{
    if (IHAM.disabled) return false;
    var container = $('#details');
    if (fast)
        num *= 16;

    var cur = $('TR.focus');
    var all = $('TABLE.shown TR');
    var from = all.index(cur);
    var to = from + num;

    if (to < 0)
        to = 0;
    if (to >= all.length)
        to = all.length - 1;

    $('.focus').removeClass('focus');
    all.eq(to).addClass('focus');
    var curScroll = container.scrollTop();
    var scrollTop = container.scrollTop();
    var scrollBottom = ( scrollTop
                       + container.height() 
                       - 14
                        );
    var scrollMiddle = ( scrollTop 
                       + Math.floor((scrollBottom - scrollTop) / 3)
                        );
    scrollMiddle -= scrollMiddle % 14;

    var at = to * 14;
    var to = curScroll + (num * 14);
    if (at < scrollTop) {
        container.scrollTop(to);
    } else if (at > scrollBottom) {
        container.scrollTop(to);
    } else if (at === scrollMiddle) {
        container.scrollTop(to);
    } 
};

IHAM.prepareToCategorize = function(inc)
{
    if (IHAM.disabled) return false;
    var cats = $('#summary TR');
    var prep = $('#summary TR.prepared');
    var cur = $('#summary TR.current');
    var base = cats.index(cur);
    var from = cats.index(prep);
    var to = from + inc;

    if (base === cats.length - 1)
    {   // starting from BALANCE, allow to resettle there
        if (to === -1)
            to = cats.length - 1;
        if (to === cats.length)
            to = 0;
    }
    else
    {   // not starting from BALANCE, don't allow to categorize to BALANCE
        if (to === -1)
            to = cats.length - 2;
        if (to === cats.length - 1)
            to = 0;
    }

    from = cats.eq(from);
    from.removeClass('prepared');

    to = cats.eq(to);
    to.addClass('prepared');
};

IHAM.viewCategory = function(inc)
{
    if (IHAM.disabled) return false;
    var cats = $('#summary TR');
    var cur = $('#summary TR.current');
    var from = cats.index(cur);
    var to = from + inc;

    if (to === -1)
        to = cats.length - 1;
    if (to === cats.length)
        to = 0;

    from = cats.eq(from);
    $('#details TABLE[cid="' + from.attr('cid') + '"]').removeClass('shown');
    from.removeClass('current prepared');

    to = cats.eq(to);
    $('#details TABLE[cid="' + to.attr('cid') + '"]').addClass('shown');
    to.addClass('current prepared');
    
    $('TR.focus').removeClass('focus');
    $('TABLE.shown TR').eq(0).addClass('focus');
    $('#details').scrollTop(0);
};

IHAM.categorize = function()
{   // This is a heinous function. Sweet mercy.

    if (IHAM.disabled) return false;

    // Start grabbing stuff and try to bail early.
    // ===========================================

    var cats = $('#summary TR');
    var from = $('#summary TR.current');
    var from_cid = from.attr('cid');
    var to = $('#summary TR.prepared');
    var to_cid = to.attr('cid');
   
    if (from_cid === to_cid)
        // The quasi-mode key was released, but not in the context of an 
        // actual categorization request.
        return; 


    // Notify the server of the customer's intention.
    // ==============================================
    // As usual, we proceed optimistically to update our UI without waiting to
    // hear back from the server. This results in a much snappier user
    // interface.

    var row = $('TR.focus');
    var tid = row.attr('tid');
    var amount = $('TD.amount', row).text();
    
    if (to_cid === "-1") // XXX Borked in anonymous, where we use "uncategorized".
        jQuery.getJSON('/uncategorize.json', {tid: tid});
    else
        jQuery.getJSON('/categorize.json', {tid: tid, cid: to_cid});


    // Update the focus.
    // =================
    // We want to advance the transaction focus to the next row.

    var rows = $('TABLE.shown TR');
    var i = rows.index(row);
    var refocus = rows.eq(i + 1);
    if (!refocus.length) // We moved the last row. Select prior.
        refocus = rows.eq(i - 1); // if i is 0, the addClass will be a noop
    refocus.addClass('focus');


    // Shuffle rows between tables.
    // ============================
    // "from" and "to" are summary rows. "row" is a detail row from a category 
    // detail (not the BALANCE detail).
    
    _from = from; // preserve original for resetting "prepared" state
    if (from_cid === '-2')  // from BALANCE table
    {
        from_cid = row.attr('cid');
        from = $('#summary TR[cid="' + from_cid + '"]');
        row.removeClass('focus')

        // Set "row" to a category detail row, not a BALANCE detail row.
        row = $('TABLE[cid="' + from_cid + '"] TR[tid="' + tid + '"]');
    }
    row.detach();
    row.removeClass('focus');


    // Update the BALANCE table.
    // =========================

    var balanceRow = $('TABLE[cid="-2"] TR[tid="' + tid + '"]');
    balanceRow.attr('cid', to_cid);

    var newCat = $('TH', to).html();
    if (to_cid === "-1")
        newCat = "<div>-</div>"; // XXX This is brittle.
    $('TD.category B', balanceRow).html(newCat);


    // Insert into new table.
    // ======================
    // XXX Need to do this in sort order and clean up date.

    var newTable = $('TABLE[cid="' + to_cid + '"]');
    var newTableRows = $('TR', newTable);
    var target = row.attr('sort_key');
    var i;
    for (i=0; i < newTableRows.length; i++)
        if (newTableRows.eq(i).attr('sort_key') < target)
            break;
    if (i === 0)
        newTable.prepend(row);
    if (i === cats.length)
        newTable.append(row);
    else
        row.insertBefore(newTableRows.eq(i));


    // Update summary amounts.
    // =======================

    entering = $('TD.amount B', to);
    entering.html(IHAM.commaize(IHAM.add(entering.text(), amount)));

    leaving = $('TD.amount B', from);
    leaving.html(IHAM.commaize(IHAM.subtract(leaving.text(), amount)));


    // Switch state back.
    // ==================

    _from.addClass('prepared');
    to.removeClass('prepared');
};

IHAM.parseDecimal = function(s)
{   // Do some hackish decimal math, assuming two decimal places.
    var foo = s.replace(',', '');
    var parts = foo.split('.');
    var whole = parseInt(parts[0], 10) * 100;
    var sign = whole < 0 ? -1 : 1;
    whole = Math.abs(whole);
    var part = parts[1] === undefined ? 0 : parseInt(parts[1], 10);
    var combined = whole + part;
    return (combined * sign);
};

IHAM.add = function(d1, d2)
{
    d1 = IHAM.parseDecimal(d1);
    d2 = IHAM.parseDecimal(d2);
    return (d1 + d2) / 100;
};

IHAM.subtract = function(d1, d2)
{
    d1 = IHAM.parseDecimal(d1);
    d2 = IHAM.parseDecimal(d2);
    return (d1 - d2) / 100;
};

IHAM.commaize = function(f)
{   // This is a port of a Python function used server-side. Brittle! 
    if (f === 0)
        return ( "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + "0"
               + "&nbsp;&nbsp;&nbsp;"
                );
    f = f.toFixed(2);
    var sign = '';
    if (f[0] === '-')
    {
        sign = '-';
        f = f.slice(1);
    }
    var len = f.length;
    for (var i=len, j; i > 0; i--)
    {
        j = len - i;
        if (j > 3 && j % 3 === 0)
            f = f.slice(0,i) + "," + f.slice(i,f.length);
    }
    f = sign + f;
    while (f.length < 11)
        f = " " + f;
    while (f.indexOf(" ") !== -1)
        f = f.replace(" ", "&nbsp;");
    return f;
};


/* Navigation */
/* ========== */

IHAM.preparing = false;
IHAM.keydown = function(e)
{
    if (IHAM.disabled) return false;

    var dir = 1;
    //console.log(e.which);
    switch (e.which)
    {
        case 75: dir = -1;  // k
        case 74:            // j
            if (IHAM.preparing)
                IHAM.prepareToCategorize(dir);
            else
                IHAM.scrollVertically(dir, e.ctrlKey);
            break;
        case 68: dir = -1   // d 
        case 70:            // f 
            IHAM.viewCategory(dir);
            break;
        case 83:            // s
            IHAM.preparing = true;
            break;
        case 27:            // esc 
            IHAM.openModal();
            break;
        case 51:            // 3
            if (e.shiftKey)
                IHAM.deleteCategory();
            break;
        case 78:            // n
            if (e.shiftKey)
                IHAM.createCategory();
            break;
        case 66:            // b
            if (e.shiftKey)
                IHAM.updateBalance();
            break;
    }
};
IHAM.keyup = function(e)
{
    if (IHAM.disabled) return false;

    var to = 1;
    //console.log(e.which);
    switch (e.which)
    {
        case 83: // s 
            IHAM.preparing = false;
            IHAM.categorize();
            break;
    }
};


/* Modal Screen (Cat!) */
/* ==================== */

IHAM.modalLoaded = false;
IHAM.loadModal = function()
{
    jQuery.get('/modal.html', function(html) 
    {
        $('#modal-wrap').html(html) 

        // Wire up the auth form. No-op if already signed in.
        $('#fake').click(IHAM.playWithFakeData);
        $('FORM#auth').submit(IHAM.submitAuthForm);
        $('FORM#auth #other').click(IHAM.toggleAuthForm);
        IHAM.switchToSignIn();

        // Wire up the payment form. No-op if ANON.
        IHAM.initPayment();

        // Wire up the modal tabs. No-op if not PAID.
        IHAM.initModalTabs();

        IHAM.modalLoaded = true;
    });
};

IHAM.openModal = function(pane)
{
    IHAM.disabled = true;

    if (!IHAM.modalLoaded)
    {
        IHAM.spin()
        return setTimeout(function() { IHAM.openModal(pane) }, 200);
    }
   
    // Clean up any prepared state.
    IHAM.preparing = false;
    $('#summary .prepared').removeClass('prepared');
    $('#summary .current').addClass('prepared');

    $('#modal INPUT').eq(0).focus();
    $('#modal-wrap').show();
    $(document).unbind('keypress');
    $(document).unbind('keydown');
    $(document).unbind('keyup');
    $(document).keydown(function(e) 
    { 
        if (IHAM.disabled) return false;
        if (e.which === 27)
            IHAM.closeModal();
    });
    if (pane !== undefined)
        $('LI[pane="' + pane + '"]').click();
    IHAM.stopSpinning()
};

IHAM.closeModal = function()
{
    IHAM.disabled = false;
    $('#modal-wrap').hide();
    $(document).unbind('keypress');
    $(document).unbind('keydown');
    $(document).keydown(IHAM.keydown);
    $(document).keyup(IHAM.keyup);
    return false;
};


/* Form Generics */
/* ============= */

IHAM.feedbackOut = null; // {clear,set}Timout handler
IHAM.showFeedback = function(msg, details)
{
    window.clearTimeout(IHAM.feedbackOut);
    $('#eyes').stop(true, true).show()
    
    msg += '<div class="details"></div>';
    $('#feedback').stop(true, true).html(msg).show();
    if (details !== undefined)
        for (var i=0; i < details.length; i++)
            $('#feedback .details').append('<p>' + details[i] + '</p>');
    
    IHAM.feedbackOut = setTimeout(function()
    {
        $('#eyes').hide();
        $('#feedback').hide();
    }, 15000);
}

IHAM.submitForm = function(url, data, success, error)
{
    if (success === undefined)
    {
        success = function()
        {   
            window.location.href = "/";
        }
    }

    if (error === undefined)
    {
        error = function(data)
        {
            IHAM.showFeedback(data.problem);
        };
    }
    
    function _success(data)
    {
        if (data.problem === "" || data.problem === undefined)
            success(data);
        else
            error(data);
    }

    function _error(xhr, foo, bar)
    {
        IHAM.showFeedback("So sorry!!");
        console.log("failed", xhr, foo, bar);
    }

    jQuery.ajax({ url: url
                , type: "POST"
                , data: data
                , dataType: "json"
                , success: _success
                , error: _error
                 });
}


/* Auth Form */
/* ========= */

IHAM.toggleAuthForm = function(e)
{
    e.preventDefault();
    e.stopPropagation();
    if ($('FORM#auth #other').text() === 'Register')
        IHAM.switchToRegister();
    else
        IHAM.switchToSignIn();
    return false;
};

IHAM.playWithFakeData = function()
{
    IHAM.switchToRegister();
    IHAM.closeModal();
    return false;
};

IHAM.submitAuthForm = function(e)
{
    e.preventDefault();
    e.stopPropagation();

    var url = "";
    var data = {};
    data.email = $('INPUT[name=email]').val();
    data.password = $('INPUT[name=password]').val();

    if ($('FORM#auth BUTTON').text() === 'Register')
    {
        url = "/register.json";
        data['confirm'] = $('INPUT[name=confirm]').val();
    }
    else
    {
        url = "/sign/in.json";
    }

    IHAM.submitForm(url, data);

    return false;
};

IHAM.switchToSignIn = function()
{
    $('FORM#auth .password').removeClass('half left');
    $('FORM#auth .confirm').hide();
    $('FORM#auth #other').text('Register');
    $('FORM#auth BUTTON').text('Sign In');
    $('FORM#auth INPUT').eq(0).focus();
};

IHAM.switchToRegister = function()
{
    $('FORM#auth .password').addClass('half left');
    $('FORM#auth .confirm').show();
    $('FORM#auth #other').text('Sign In');
    $('FORM#auth BUTTON').text('Register');
    $('FORM#auth INPUT').eq(0).focus();
};


/* Upload Form */
/* =========== */

IHAM.submitUploadForm = function(e)
{
    // TODO http://blueimp.github.com/jQuery-File-Upload/
};



/* Spinner */
/* ======= */

IHAM.spin = function()
{
    IHAM.disabled = true;
    $('#spinner').show();
};

IHAM.stopSpinning = function()
{
    $('#spinner').hide();
    IHAM.disabled = false;
};


/* Payment Details Form */
/* ==================== */

IHAM.haveSamurai = false;
IHAM.samuraiAttempts = 0;
IHAM.submitPaymentForm = function(e)
{
    e.stopPropagation();
    e.preventDefault();
    IHAM.spin()

    if (!IHAM.haveSamurai)
    {
        if (IHAM.samuraiAttempts++ === 50)
            alert( "Gah! Apparently I don't want your money after all. If "
                 + "you're really motivated, call me (Chad) at 412-925-4220 "
                 + "and we'll figure this out. Sorry. :-("
                  );
        else
            setTimeout(IHAM.submitPaymentForm, 200);
        return false;
    }
    
    function val(field)
    {
        return $('FORM#payment INPUT[name="' + field + '"]').val();
    };

    var data = {};          // top-level POST body

    var pmt = val('payment_method_token');
    if (pmt !== undefined)
        data.payment_method_token = pmt;

    var credit_card = {};   // holds CC info
    credit_card.first_name = val('first_name');
    credit_card.last_name = val('last_name');
    credit_card.address_1 = val('address_1');
    credit_card.address_2 = val('address_2');
    credit_card.city = val('city');
    credit_card.state = val('state');
    credit_card.zip = val('zip');
    credit_card.card_number = val('card_number');
    credit_card.cvv = val('cvv');
    
    var expiry = val('expiry').split('/');
    credit_card.expiry_month = expiry[0];
    credit_card.expiry_year = expiry[1];
    
    data.credit_card = credit_card; 
    Samurai.payment(data, IHAM.savePaymentMethod);

    return false;
};

IHAM.savePaymentMethod = function(data)
{
    // Afaict this is always present, no matter the garbage we gave to Samurai.
    var pmt = data.payment_method.payment_method_token;
    var dayOfMonth = $('#dayOfMonth').attr('dayOfMonth');
    var action = $('FORM#payment BUTTON').text();

    function detailedFeedback(data)
    {
        var details = [];
        for (var field in data.errors) 
        {
            var errors = data.errors[field];
            var nerrors = errors.length;
            for (var i=0; i < nerrors; i++)
                details.push(errors[i]);
        }

        IHAM.showFeedback(data.problem, details);
        IHAM.stopSpinning();
    }

    IHAM.submitForm( "/pmt/save.json"
                         , {pmt: pmt, day_of_month: dayOfMonth, action: action}
                         , undefined
                         , detailedFeedback
                          );
};

IHAM.setDayOfMonth = function(dayOfMonth)
{
    var blah = [ '' 
               , 'first', 'second', 'third', 'fourth', 'fifth'
               , 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'
               , 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth'
               , 'sixteenth', 'seventeenth', 'eighteenth', 'ninteenth'
                , 'twentieth'
               , 'twenty-first', 'twenty-second', 'twenty-third'
                , 'twenty-fourth', 'twenty-fifth'
               , 'twenty-sixth', 'twenty-seventh', 'twenty-eighth'
                , 'twenty-ninth', 'thirtieth'
               , 'thirty-first'
                ];

    if (dayOfMonth === null || dayOfMonth === undefined)
        dayOfMonth = (new Date()).getDate();
    
    $('#dayOfMonth').attr('dayOfMonth', dayOfMonth).text(blah[dayOfMonth]);
    if (dayOfMonth > 28)
        $('#orLast').html(" (or last) ");
};


// dead mouse
// ==========

IHAM.showDeadMouse = function()
{
    $('#dead-mouse').show();
    $('#help-button').addClass('dead-mouse');
};

IHAM.hideDeadMouse = function()
{
    $('#dead-mouse').hide();
    $('#help-button').removeClass('dead-mouse');
};

IHAM.flashDeadMouseHandle = null;
IHAM.flashDeadMouse = function(e)
{
    IHAM.showDeadMouse();
    clearTimeout(IHAM.flashDeadMouseHandle)
    IHAM.flashDeadMouseHandle = setTimeout(IHAM.hideDeadMouse, 250);
};


// main 
// ====

IHAM.init = function(session)
{
    IHAM.scrollbarWidth = IHAM.getScrollbarWidth();
    $(window).resize(IHAM.resize);
    IHAM.resize();

    // Wire up the corner.
    $('#help-button BUTTON').click(IHAM.openModal);

    // The mouse, it is dead.
    $('#mouse-killer').mousedown(IHAM.showDeadMouse)
                      .mouseup(IHAM.hideDeadMouse)
                      .mousewheel(IHAM.flashDeadMouse);

    // Set initial highlight state.
    $('#summary TR').eq(-1).addClass('current prepared');
    var table = $('#details TABLE').eq(-1);
    table.addClass('shown');
    $('TR', table).eq(0).addClass('focus');

    IHAM.session = session;
    IHAM.loadModal();
};

IHAM.initPayment = function()
{
    $('#modal INPUT').eq(0).focus();
    $('FORM#payment').submit(IHAM.submitPaymentForm);
    $('INPUT[name=expiry]').mask('99/2099');

    // Lazily depend on Samurai. 
    var samurai_js = "https://samurai.feefighters.com/assets/api/samurai.js";
    jQuery.getScript(samurai_js, function()
    {
        Samurai.init({merchant_key: IHAM.session.merchant_key});
        IHAM.haveSamurai = true;
    });
};

IHAM.initModalTabs = function()
{
    IHAM.setDayOfMonth(IHAM.session.day_of_month_to_bill);
    $('#modal-mask').click(IHAM.closeModal);

    function toggler(paneName)
    {
        return function() 
        {
            $('#pane-nav .selected').removeClass('selected');
            $('#pane-nav LI[pane=' + paneName + ']').addClass('selected');
            $('.pane').hide();
            $('.pane[pane=' + paneName + ']').show();
        };
    }

    var paneNav = $('#pane-nav');
    $('.pane').each(function(i)
    {
        var title = $('H2 SPAN', this).text();
        var paneName = $(this).attr('pane');
        paneNav.append('<li pane="' + paneName + '"><span>' + title + '</span></li>');
        $('li', paneNav).eq(i).click(toggler(paneName));
    });

    $('LI[pane]').eq(0).click();
};
