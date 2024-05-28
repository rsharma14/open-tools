
let gpt = 0;
let eventSource;
let conversationIdx = 0;
let resp = '';
let chatHistory = parse(localStorage.getItem("chatHistory"));
chatHistory = chatHistory ? chatHistory : [];
var query, token, cid;
var conversation_id = "";
var parent_message_id = "";
let gpts = ["O", "B", "C"];
const PARENT_URL = "https://merawork.in/api/backapp-service";
const loginUrl = `${PARENT_URL}/auth/v1/public/login`;

document.addEventListener('DOMContentLoaded', function () {
    onDocLoad();
});

function onDocLoad() {

    chatHistory.forEach(h => {
        addToHistoryDiv(h);
    });

    document.getElementById("query").addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            clickCB();
        }
    });
}

function addToHistoryDiv(h) {
    var a = createEl("a", null, "nodec historyAnchor");
    a.href = "javascript:void(0)";
    a.onclick = function () { pickHistoryChat(this, h); };
    a.appendChild(document.createTextNode(h[0]));
    document.getElementById("chatHistory").prepend(a);
}
function addToHistory(q) {
    let h = [q, conversation_id, parent_message_id];
    chatHistory.push(h);
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    addToHistoryDiv(h);
}

function pickHistoryChat(e, q) {
    document.getElementById("query").value = q[0];
    conversation_id = q[1];
    parent_message_id = q[2];
    clickCB();
}
function clickCB() {
    document.getElementById("toggle-checkbox").click();
}
function submitQuery(e, qid, cb) {

    if (e && !e.checked) {
        closeStream();
        return;
    }
    query = document.getElementById(qid ? qid : "query").value;
    token = document.getElementById("token").value;
    cid = document.getElementById("cid").value;
    if (!query || query.trim().length <= 0) {
        clickCB();
        return;
    }

    if (cb && typeof cb === "function")
        cb();

    createConversionBlock(++conversationIdx);
    insertQuery(query);
    scrollToBottom("content");

    document.getElementById(`data_${conversationIdx}`).innerHTML = '<div class="blink_me">Processing...</div>';
    if (gpt === 0) {
        openaiGPT(query, token, cid);
    } else if (gpt === 1) {
        bardGPT(query);
    } else if (gpt === 2) {
        converseGPT(query);
    }

    errorStream();

}

function onComplete(q) {
    clickCB();
    addToHistory(query);
    markedSyntax();

}
function openaiGPT(q, t, c) {
    console.log("openaiGPT");

    eventSource = new EventSource(`${PARENT_URL}/gpt/openai-gpt?q=${encodeURIComponent(q)}&token=${t}&conversation_id=${conversation_id}&parent_message_id=${parent_message_id}`);
    eventSource.addEventListener("message", (e) => {
        scrollToBottom("content");

        let p = parse(e.data);
        //console.log(p)
        if (!p) return;

        if (p.is_completion) {
            conversation_id = p.conversation_id;
            parent_message_id = p.id;
            onComplete();
        } else {
            resp = p.message?.content?.parts.join();
            document.querySelector(`#data_${conversationIdx}`).innerHTML = escapeHtml(resp);
            conversation_id = p.conversation_id;
            parent_message_id = p.message.id;
        }
    });
}
function bardGPT(q) {
    console.log("bardGPT");

    alert("bardGPT not implemented yet");
}
function converseGPT(q) {
    console.log("converseGPT");

    eventSource = new EventSource(`${PARENT_URL}/gpt/converse-gpt?q=${encodeURIComponent(q)}`);
    let i = 0;
    eventSource.addEventListener("message", (e) => {
        //console.log(e);
        scrollToBottom("content");
        if (i++ == 0)
            document.querySelector(`#data_${conversationIdx}`).innerHTML = '';

        if (e.data.indexOf("DONE") > 0) {
            conversation_id = "";
            parent_message_id = "";
            onComplete();
        } else {
            let a = JSON.parse(e.data);
            resp = a.choices.map(a => a.delta.content).join();
            document.querySelector(`#data_${conversationIdx}`).innerHTML += escapeHtml(resp);
        }
        //console.log(resp)

    });
}
function errorStream() {
    //console.log("error stream");
    eventSource.addEventListener("error", (e) => {
        onComplete();
        document.querySelector(`#data_${conversationIdx}`).innerHTML += "error";
        console.log(e);

    });

}
function closeStream() {
    if (!eventSource) return;
    //console.log("closed stream");
    eventSource.close();
    eventSource = null;
}

function scrollToBottom(id) {
    const messageContainer = document.getElementById(id);
    messageContainer.scrollTop = messageContainer.scrollHeight;

}
function parse(json) {
    try {
        return JSON.parse(json);
    } catch (err) { }
    return null;
}
function markedSyntax(e) {
    let id = `data_${conversationIdx}`;
    const renderer = new marked.Renderer();
    renderer.code = (code, language) => {
        const lang = language && hljs.getLanguage(language);
        const cd = lang ? hljs.highlight(code, { language }).value : hljs.highlightAuto(code).value;
        return `<div><div class="code-header"><span style="margin-right: auto;">${language}</span><span style="margin-left: auto;"><a href="javascript:void(0)" onclick="copyBlock(this)" class="nodec">copy &#10064;</a></span></div><pre><code class="hljs ${language}">${cd}</code></pre></div>`;
    }
    marked.setOptions({
        renderer: renderer
    });
    document.getElementById(`conv_${conversationIdx}`).classList.toggle("whitespace-pre-wrap");
    let rawText = document.getElementById(id).innerHTML;
    document.getElementById(id).innerHTML = marked.parse(htmlDecode(rawText));


}
function copyBlock(token) {
    //console.log(token);
    if (document.selection) {
        // IE
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(token));
        range.select();
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(token.parentNode.parentNode.nextSibling);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand("copy");
    }

}
function createConversionBlock(id) {

    var editBtn = createEl("a", "edit_" + id, "nodec", { marginLeft: "auto", marginBottom: "auto" });
    editBtn.href = "javascript:void(0)";
    editBtn.onclick = function () { editQuery(this, id); };
    let icon = createEl("i");
    icon.innerHTML = "&#9998;";
    editBtn.appendChild(icon);

    var queryDiv = createEl("div", "querybox_" + id, "query");
    queryDiv.appendChild(editBtn);

    var convDiv = createEl("div", "conv_" + id, "conversation whitespace-pre-wrap break-words");
    convDiv.appendChild(queryDiv);
    var dataDiv = createEl("div", "data_" + id, "conversation");
    convDiv.appendChild(dataDiv);
    convDiv.appendChild(createEl("hr"));

    var targetElement = document.getElementById("content");
    targetElement.appendChild(convDiv);

}
function editQuery(e, id) {

    var editableDiv = document.getElementById(`query_` + id);
    if (editableDiv.classList.contains('editMode')) return;
    var content = editableDiv.innerHTML;

    var inputField = createEl("textarea", `queryIp_` + id, null, { width: "100%", resize: "vertical" });
    inputField.onmousedown = function () {
        inputField.style.height = (inputField.scrollHeight) + "px";
    }
    inputField.value = content;

    var submitButton = createEl("button");
    submitButton.innerHTML = "&#10004;";
    submitButton.onclick = function () {

        let e = document.getElementById(`toggle-checkbox`);
        if (e.checked)
            clickCB();

        e.checked = true;
        submitQuery(e, `queryIp_${id}`, () => {
            editableDiv.innerHTML = content;
            editableDiv.classList.remove("editMode");
        });

    };

    var cancelButton = createEl("button");
    cancelButton.innerHTML = "&#10060;";
    cancelButton.onclick = function () {
        editableDiv.innerHTML = content;
        editableDiv.classList.remove("editMode");
    };

    var buttonDiv = createEl("div", null, null, { float: "right" });
    buttonDiv.appendChild(submitButton);
    buttonDiv.appendChild(cancelButton);

    editableDiv.innerHTML = '';
    editableDiv.appendChild(inputField);
    editableDiv.appendChild(buttonDiv);

    editableDiv.classList.add("editMode");
}

function insertQuery(query) {
    document.getElementById(`querybox_${conversationIdx}`).insertAdjacentHTML("afterbegin",
        `<strong class="gpt-name" style="margin-left: auto;margin-bottom: auto;">${gpts[gpt]}</strong>
       <sapn id=query_${conversationIdx} style='width:100%;margin-right: 12px;'>${escapeHtml(query)}</span>`);
    document.getElementById(`query`).value = '';
}
function createEl(el, id, className, style) {
    var elm = document.createElement(el);
    if (id) elm.id = id;
    if (className) elm.className = className;
    if (style) Object.assign(elm.style, style);


    return elm;


}
const escapeHtml = (txt) => {
    return txt?.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
function htmlDecode(input) {
    var e = document.createElement('textarea');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}