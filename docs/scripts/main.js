/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 有限会社テンパス・フュジット Tempus Fugit,Inc.
 * http://www.tempusfugit.jp/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * TODO: https://github.com/ogis-miyamura/browsertotp/issues
 */
Sync = (function() {

function Sync(func, intervalMin) {
  this.__f = func;
  this.__i = intervalMin * 60 * 1000;
  this.__next = null;
  this.__tid = null;
  this.__awake = awake.bind(this);
}
Sync.prototype.start = function(syncSec) {
  syncSec = (syncSec % 60) * 1000 || 60000;
  var now = new Date().getTime();
  var elapsed = (now % syncSec);
  this.__next = now - elapsed + syncSec;
  this.__awake();
};
Sync.prototype.stop = function() {
  if(this.__tid !== null) {
    clearTimeout(this.__tid);
    this.__tid = null;
  }
};
function awake() {
  var now = new Date().getTime();
  if(now >= this.__next) {
    this.__next += this.__i;
    this.__tid = setTimeout(this.__awake, this.__next - now - 1000);
    this.__f();
  } else {
    this.__tid = setTimeout(this.__awake, this.__next - now);
  }
}
return Sync;
})();

const NAME_LABEL_TEXTCONTENT = "任意の名前: ";
const KEY_LABEL_TEXTCONTENT = "シークレット設定キー: ";
const URL_LABEL_TEXTCONTENT = "ログインURL: ";

const BUTTON_ADD_OK_TEXTCONTENT = "MFAキーを登録する";
const BUTTON_REMOVE_OK_TEXTCONTENT = "このMFAキーを削除する";
const BUTTON_REMOVE_CANCEL_TEXTCONTENT = "キャンセルする";

const ADD_DIALOG_TITLE = "MFAキー情報の新規登録";
const REMOVE_DIALOG_TITLE = 'MFAキー情報の削除:';

const ADDICONS_TOOLTIP = "クリックすると、MFAキー情報を新規登録します";
const REMOVEICON_TOOLTIP = "クリックすると、MFAキー情報を削除します";
const COPYKEYANDOPENURL_TOOLTIP = "クリックすると、MFAキーをクリップボードへコピーして、URLを別ウインドウで開きます";
const OPENURL_TOOLTIP = "クリックすると、URLを別ウインドウで開きます";

(function() {
  var lstorage = window.localStorage || {};
  var DATA_KEY = "items";
  var items = lstorage[DATA_KEY] ? JSON.parse(lstorage[DATA_KEY]) : [];
  var itemList = [];
  var fragment = document.createDocumentFragment();
  var itemContainer = document.getElementById("items");
  Sortable.create(itemContainer, {
    handle: ".drag_handle",
    onEnd: function(evt) {
      var item = itemList.splice(evt.oldIndex, 1)[0];
      var newList = itemList.slice(0, evt.newIndex);
      newList.push(item);
      if(evt.newIndex < itemList.length) {
        newList = newList.concat(itemList.slice(evt.newIndex));
      }
      itemList = newList;
      flushItems();
    }
  });
  for(var i = items.length - 1; i >= 0; i--) {
    addItem(items[i], fragment);
  }
  itemContainer.appendChild(fragment);

  var bars = Array.prototype.slice.call(document.getElementsByClassName("bar"));
  var addIcons = document.getElementsByClassName("add_icon");
  for(var j = 0; j < addIcons.length; j++) {
    addIcons[j].addEventListener("click", showAddDialog, false);
    addIcons[j].setAttribute('title', ADDICONS_TOOLTIP);
  }

  var iid = null;
  var sync = new Sync(synchronized, 5);
  var startSec = new Date().getSeconds();
  var rsec = 30 - startSec;
  if(rsec <= 0) { rsec += 30; }
  document.styleSheets[0].insertRule(
    "@keyframes first_bar { from { width: " + rsec / 30 * 100 + "%; } to { width: 0; } }",
    document.styleSheets.length);
  refresh("first_bar", rsec);
  sync.start(startSec > 0 && startSec <= 30 ? 30 : 0);

  var addContent = null;
  function showAddDialog() {
    var inputName, inputKey;
    if(addContent === null) {
      addContent = document.createElement("div");
      var labelName = document.createElement("label");
      inputName = document.createElement("input");
      var labelKey = document.createElement("label");
      inputKey = document.createElement("input");
      var labelUrl = document.createElement("label");
      inputUrl = document.createElement("input");
      var buttonOk = document.createElement("button");
      addContent.className = "add_dialog";
      labelName.textContent = NAME_LABEL_TEXTCONTENT;
      inputName.type = "text";
      inputName.id = "input_name";
      labelKey.textContent = KEY_LABEL_TEXTCONTENT;
      inputKey.type = "text";
      inputKey.id = "input_key";
      labelUrl.textContent = URL_LABEL_TEXTCONTENT;
      inputUrl.type = "text";
      inputUrl.id = "input_Url";
      buttonOk.textContent = BUTTON_ADD_OK_TEXTCONTENT;

      var div = document.createElement("div");
      labelName.appendChild(inputName);
      div.appendChild(labelName);
      addContent.appendChild(div);

      div = document.createElement("div");
      labelKey.appendChild(inputKey);
      div.appendChild(labelKey);
      addContent.appendChild(div);

      div = document.createElement("div");
      labelUrl.appendChild(inputUrl);
      div.appendChild(labelUrl);
      addContent.appendChild(div);

      addContent.appendChild(buttonOk);
      buttonOk.addEventListener("click", function() {
        var name = inputName.value;
        var key;
        var url = inputUrl.value;
        if(name.length <= 0){ return; }
        try {
          key = Hotp.decodeBase32(inputKey.value.toUpperCase());
        } catch(e) {
          alert(e.message);
          return;
        }
        addItem({name: name, key: key, url: url});
        flushItems();
        refresh();
        dialog.close();
      }, false);
    }
    dialog.setTitle(ADD_DIALOG_TITLE);
    dialog.setContent(addContent);
    (inputName || document.getElementById("input_name")).value = "";
    (inputKey || document.getElementById("input_key")).value = "";
    (inputUrl || document.getElementById("input_Url")).value = "";
    dialog.show();
  }

  function addItem(item, container) {
    container = container || itemContainer;
    var wrapper = document.createElement("div");
    var head = document.createElement("div");
    var name = document.createElement("div");
    var url = document.createElement("div");
    var icon = document.createElement("div");
    var hval = document.createElement("div");
    head.className = "drag_handle";
    name.textContent = item.name;
    url.textContent = item.url;

    var listItem = {
      item: item,
      elem: hval
    };

    icon.addEventListener("click", function() { confirmRemove(listItem); }, false);
    icon.setAttribute('title', REMOVEICON_TOOLTIP);

    hval.id = "hval_text";
    hval.setAttribute('title', COPYKEYANDOPENURL_TOOLTIP);

    url.id = "url_text";
    url.setAttribute('title', OPENURL_TOOLTIP);

    head.appendChild(name);
    head.appendChild(icon);
    wrapper.appendChild(head);
    wrapper.appendChild(hval);
    wrapper.appendChild(url);
    container.insertBefore(wrapper, container.firstChild);
    itemList = [listItem].concat(itemList);
  }

  var removeContent = null;
  function confirmRemove(listItem) {
    var buttonOk;
    if(removeContent === null) {
      removeContent = document.createElement("div");
      var div = document.createElement("div");
      removeContent.appendChild(div);
      div = document.createElement("div");
      buttonOk = document.createElement("button");
      buttonOk.id = "remove_ok";
      var buttonCancel = document.createElement("button");
      removeContent.className = "remove_dialog";
      buttonOk.textContent = BUTTON_REMOVE_OK_TEXTCONTENT;
      buttonCancel.textContent = BUTTON_REMOVE_CANCEL_TEXTCONTENT;
      div.appendChild(buttonCancel);
      div.appendChild(buttonOk);
      removeContent.appendChild(div);
      buttonCancel.addEventListener("click", function() {
        dialog.close();
      }, false);
    }
    removeContent.firstChild.textContent = REMOVE_DIALOG_TITLE + ' "' + listItem.item.name + '"';
    dialog.setTitle("Remove");
    dialog.setContent(removeContent);
    (buttonOk || document.getElementById("remove_ok")).onclick =  function() {
      var idx = itemList.indexOf(listItem);
      itemList.splice(idx, 1);
      itemContainer.removeChild(listItem.elem.parentNode);
      flushItems();
      dialog.close();
    };
    dialog.show();
  }

  function flushItems() {
    var itms = [];
    itemList.forEach(function(val) {
      itms.push(val.item);
    });
    lstorage[DATA_KEY] = JSON.stringify(itms);
  }

  function refresh(frames, asec) {
    var aboutNow = Math.round(new Date().getTime() / 1000);
    var i;
    for(i = 0; i < itemList.length; i++) {
      var hotpNumber = Hotp.generate(itemList[i].item.key, (aboutNow / 30) & 0xffffffff);
      itemList[i].elem.textContent = ("00000" + hotpNumber).slice(-6);
    }
    for(i = 0; i < bars.length; i++) {
      var p = bars[i].parentNode;
      p.removeChild(bars[i]);
      bars[i].style.animation = (frames || "bar") + " " + (asec || "30") + "s linear";
      p.appendChild(bars[i]);
    }

    $("#hval_text").on("click", function(){
      // Select text. (supports 'div' tag)
      var range = document.createRange();
      range.selectNodeContents(this);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      // Copy text to Clipboard.
      document.execCommand('copy');

      // Click next sibiling (Open Url).
      var url = this.nextSibling;
      url.click();
    })

    $("#url_text").on("click", function(){
      // Open Url.
      var url = this.textContent;
      window.open(url, '_blank');
    })

  }

  var dialog = {};
  var overlay = document.getElementById("overlay");
  overlay.style.display = "none";
  dialog.show = function() {
    overlay.style.display = "block";
  };
  dialog.close = function() {
    overlay.style.display = "none";
  };
  dialog.setTitle = function(title) {
    document.getElementById("dialog_title").textContent = title;
  };
  dialog.setContent = function(content) {
    var dialogContainer = document.getElementById("dialog_content");
    while(dialogContainer.lastChild) {
      dialogContainer.removeChild(dialogContainer.lastChild);
    }
    dialogContainer.appendChild(content);
  };
  document.getElementById("dialog_close").addEventListener("click", function() { dialog.close(); }, false);

  if (items.length == 0) {
    showAddDialog();
  }

  function synchronized() {
    if(iid !== null) {
      clearInterval(iid);
    }
    refresh();
    iid = setInterval(refresh, 30000);
  }
})();
