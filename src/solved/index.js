var stopWordsFound = 0;
var levelIndex = -1;
var misses = 0;

// 0. Create new Firebase app. https://console.firebase.google.com/ and import stop-hunter-export.json.

function signIn() {
    // 1. Sign in with firebase. https://firebase.google.com/docs/auth/web/google-signin
    // stub: alert("sign in stub");
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .catch(function(error) {
            console.log(error);
            firebase.auth().signInWithPopup(new firebase.auth.GithubAuthProvider());
        });
}

function signOut() {
    // 2. Sign out with firebase. https://firebase.google.com/docs/auth/web/google-signin#next_steps
    //stub: alert("sign out stub");
    firebase.auth().signOut();
}

window.onload = function() {
    // 3. Subscribe on sign in changes. https://firebase.google.com/docs/auth/web/manage-users
    // stub: updateUserView(null);

    // 4. Subscribe on scoreboard changed. https://firebase.google.com/docs/database/web/read-and-write#listen_for_value_events
    // 5. Limit scoreboard to 10 top records. https://firebase.google.com/docs/database/web/lists-of-data#sort_data
    // 6. Add index in console. https://firebase.google.com/docs/database/security/indexing-data#section-indexing-order-by-value  
    // stub: updateScoreboard({'Pavel Egorov':234, 'Dmitriy Mramorov': 238});

    firebase.auth().onAuthStateChanged(updateUserView);
    firebase.database().ref("scoreboard").orderByValue().limitToLast(10).on("value", s => updateScoreboard(s.val()));
    updateEmHandlers();
}

function startLevel(level) {
    levelIndex = level || 0;
    stopWordsFound = 0;
    misses = 0;
    // 7. Get level text from levels/{levelIndex}. Without subscription!!! https://firebase.google.com/docs/database/web/read-and-write#read_data_once
    // stub: setMainText("{Некоторый} текст");

    firebase.database().ref('levels/' + levelIndex)
        .once('value', data => setMainText(data.val().text))
        .then(() => {
            $(".main-button").show();
            $(".go-button").html("Ещё!").hide();
        }).catch(console.log);
}

function finishLevel() {
    $(".go-button").show();
    $(".main-button").hide();
    setMainText("<em>Вроде бы</em> поверженно стоп-слов — " + stopWordsFound + ". <em>При этом, к сожалению,</em> промахов — " + misses + ".");
    // 8. Send scores! (Read score then write score+1). https://firebase.google.com/docs/database/web/read-and-write#basic_write
    var user = firebase.auth().currentUser;
    if (!user) return;
    var userScoreRef = firebase.database().ref("scoreboard/" + user.displayName);
    userScoreRef.once("value", function(snap) {
        userScoreRef.set(snap.val() + 1);
    });
    updateEmHandlers();
}

// Other stuff. No more tasks below...

function updateUserView(user) {
    console.log(user);
    $(".username").html(user ? user.displayName : "anonymous");
    $(".userpic").attr("src", user ? user.photoURL : "//placehold.it/30x30");
}

function updateScoreboard(scores) {
    // scores = { 'name' : 12, 'name2' : 42 }
    console.log(scores);
    var lines =
        Object.keys(scores)
        .sort((k1, k2) => scores[k2] - scores[k1])
        .map(name => "<tr><td>" + name + "</td><td>" + scores[name] + "</td></tr>")
        .join("\r\n");
    $(".scoreboard-body").html(lines);
}

function clickText(e) {
    if (e.srcElement.className == "stop-word") {
        e.srcElement.style["text-decoration"] = "line-through";
        e.srcElement.className = null;
        stopWordsFound++;
    } else misses++;
    console.log(e);
}

function setMainText(text) {
    var textElement = $(".main");
    textElement.html(convertToHtml(text));
    textElement.css({ display: text ? "block" : "none" });
}

function convertToHtml(text, className) {
    return text.replace(/\{(.+?)\}/g, (s, a) => "<span class='stop-word'>" + a + "</span>");
}

function goNext() {
    startLevel(levelIndex + 1);
}

function updateEmHandlers() {
    $('em').click(function() { this.style["text-decoration"] = "line-through"; });
}