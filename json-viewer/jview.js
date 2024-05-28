var rawJson = json = undefined;
var objKeys = new Set();
var currentMode = 'code';
var enableQSerchFlag = false;
const container = document.getElementById("jsoneditor");

document.querySelector("#queryBar").addEventListener("focusin", () => {
    //document.querySelector("#queryBar").select();
});

document.querySelector("#queryBar").addEventListener("input", () => {
    let input = document.querySelector("#queryBar").value;
    if (!input) {
        editor.set(json);
        return;
    }
    if (!rawJson && isJSON(editor.getText()))
        rawJson = json;
    document.querySelector("#suggestions").innerHTML = filterObjKeys(input);
});

document.querySelector("#queryBtn").addEventListener("click", () => {
    searchInJSON();
});
document.querySelector("#clearFilter").addEventListener("click", () => {
    document.querySelector("#queryBar").value = null;
    document.querySelector("#suggestions").innerHTML = '';
    editor.set(json = rawJson);
});
document.querySelector("#resetBtn").addEventListener("click", () => {
    document.querySelector("#queryBar").value = null;
    document.querySelector("#suggestions").innerHTML = '';
    editor.set(json = rawJson = undefined);
});
queryBar.addEventListener("keydown", (event) => {

    if (event.keyCode === 13) {
        event.preventDefault();
        searchInJSON();
    }

});

document.addEventListener("click", () => {
    const div = document.getElementById("suggestions");
    if (!div.contains(event.target)) {
        document.querySelector("#suggestions").innerHTML = '';
    }
});
const options = {
    modes: ['text', 'code', 'tree', 'form', 'view', 'preview'],
    mode: currentMode,
};
options.onChange = (a, b, c) => {
    console.log("onChange")
    setTimeout(() => {
        if (currentMode !== 'code') return;
        if (!isJSON(editor.getText())) return;

        document.querySelector("#queryBar").value = null;
        //editor.set(json = editor.get());
        json = editor.get();
        objKeys = new Set();
        if (enableQSerchFlag)
            iterate(json, '$');
    }, 500);


}
options.onModeChange = (newMode, oldMode) => {
    currentMode = newMode;
    console.log({ newMode, oldMode });
    //if (currentMode === 'code' && enableQSerchFlag)
    //iterate(json, '$');
}
const editor = new JSONEditor(container, options)
//document.querySelector(".jsoneditor-poweredBy")?.remove();
editor.set(undefined);

function iterate(obj, stack) {
    for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (typeof obj[property] == "object") {
                iterate(obj[property], (stack + (isNumber(property) ? "[*]" : '.' + property)));
            } else {
                objKeys.add(stack + "." + property);
            }
        }
    }
    if (stack && !obj)
        objKeys.add(stack); //null/undefined value keys

}
function searchInJSON() {
    let q = document.querySelector("#queryBar").value
    document.querySelector("#suggestions").innerHTML = '';
    if (!q)
        return editor.set(json);

    editor.set(jsonPath(json, q));
}
function enableQSerch(ctx) {
    enableQSerchFlag = ctx.checked;
    if (ctx.checked == true)
        iterate(json, '$');
}
function filterObjKeys(key) {
    let ret = "";
    objKeys.forEach((o) => {
        if (o.toLowerCase().indexOf(key.toLowerCase()) > -1)
            ret += `<div class="suggestion" onclick=selectSuggestion(this)>${o}</div>`;
    });
    return ret;
}
function selectSuggestion(t) {
    document.querySelector("#queryBar").value = t.innerText?.trim();
    document.querySelector("#suggestions").innerHTML = '';
    document.querySelector("#queryBar").focus();
}
function isJSON(jsonStr) {
    try {
        JSON.parse(jsonStr);
        console.log("valid json");
        return true;
    } catch (e) {
        console.log("not valid json");
        return false;
    }
}
function isNumber(str) {
    return !isNaN(parseFloat(str)) && str.trim() !== "";
}


//editor.set(json);