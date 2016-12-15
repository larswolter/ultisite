var oldWiki = "][===Willkommen beim Wiki = Beschreibung===\n" +
    "\n" +
    "Links:\n" +
    "[[WikiLink]] [[http://externerLink]]\n" +
    "oder auch mitten im Text [[link:http://www.hupsdiebubs.de|hier klicken|Wenn sie hier klicken kommen sie ganz woanders hin]] ist sehr wichtig\n" +
    "\n" +
    "Bilder:\n" +
    "im Text einfach mit [[bild:DasBild]] oder\n" +
    "[[bild:http://www.irgendwo.de/bild.jpg]]\n" +
    "meist gecenterd\n" +
    "][[[bild:Smilie]]\n" +
    "---\n" +
    "Hier gibts tolles zu sehen, maches '''Fett''' und manches ''kursiv'' sogar einiges '''''beides''''' Aber am schönsten sind dann doch die Listen\n" +
    "* Erster %%eintrag\n" +
    "* zweiter %%Eintrag§§\n" +
    "*- Extra Zeilen im zweiten\n" +
    "*- Und noch ne dritte\n" +
    "** Hui ein §§untereintrag\n" +
    "Oder numeriert\n" +
    "# Erster %%eintrag%%\n" +
    "# zweiter §§Eintrag§§\n" +
    "## Hui ein untereintrag\n" +
    "Und jetzt die krasse Tabelle\n" +
    "||Name		||Aufgabe	||Wann 	||Ergebnis		|\n" +
    "|[[link:http://www.hansiklein.de|Hansiklein]]   |kochen	|%jetzt	|Huhn mit Kartoffeln|\n" +
    "|[[link:http://www.hansiklein.de|Mäxchen]]      |aufraümen	|gestern    |§'''nicht erfüllt'''|\n" +
    "==Weiteres==\n" +
    " Monospacce text        iiiii\n" +
    " Manchmal ja ganz nett  wwwww\n" +
    "und mit normalen zeilen\n" +
    "\n" +
    "Will man z.B. eine E-mail pasten verwendet man das quote Tag das behält jegliche Formatierung, und man kann alles außer ] reinschreiben\n" +
    "[[quote:\n" +
    "Hier kann man alles Reinschreiben.\n" +
    "z.B. eine E-Mail!\n" +
    "\n" +
    "\n" +
    "mann sollte nur keine eckige Klammer schreiben\n" +
    "Aber so sachen wie '''fetter Text''' gehen nicht mehr.\n" +
    "Das einzige was gemacht wird, sind Links die mit 'http://' beginnen, diese werden\n" +
    "anklickbar gemacht.\n" +
    "\n" +
    "http://www.djdahlem.de ist z.B. so ein Link]]\n" +
    "\n";


wikiPageTranslateOld = function (content) {
    var result = (content || "");
    result = result.replace(/===([^\n]+)===/g, "<h2>$1</h2>");
    result = result.replace(/==([^\n]+)==/g, "<h3>$1</h3>");
    result = result.replace(/'''([^\n']+)'''/g, "<b>$1</b>");
    result = result.replace(/''([^\n']+)''/g, "<i>$1</i>");
    result = result.replace(/%%([^\n%]+)%%/g, "<font color='#ff0000'>$1</font>");
    result = result.replace(/§§([^\n§]+)§§/g, "<font color='#aaaaaa'>$1</font>");
    result = result.replace(/(---)/g, "<hr>");
    result = result.replace(/\[\[link\:(http[^\|]+)\|([^\]]+)\]\]/g, "<a href='$1'>$2</a>");
    result = result.replace(/\[\[link\:(http[^\]]+)\]\]/g, "<a href='$1'>$1</a>");
    result = result.replace(/\[\[link\:([^\|]+)\|([^\]]+)\]\]/g, "<a href='/wikipage/$1'>$2</a>");
    result = result.replace(/\[\[link\:([^\]]+)\]\]/g, "<a href='/wikipage/$1'>$1</a>");
    result = result.replace(/\[\[([a-zA-Z]+)\]\]/g, "<a href='/wikipage/$1'>$1</a>");

    result = result.replace(/\[\[bild\:(http[^\]\|]+)\|(http:\/\/[^\]\|\s]*)\|([^\]\s]*)\]\]/g, "<a href='$2'><img src='$1' class='pull-$3' ></a>");
    result = result.replace(/\[\[bild\:(http[^\]\|]+)\|(http:\/\/[^\]\|\s]*)\]\]/g, "<a href='$2'><img src='$1' ></a>");
    result = result.replace(/\[\[bild\:(http[^\]\|]+)\|([^\]\|\s]*)\]\]/g, "<img src='$1' class='pull-$3' >");
    result = result.replace(/\[\[bild\:(http[^\]]+)\]\]/g, "<img src='$1'>");

    result = result.replace(/\[\[bild\:([^\]\|]+)\|(http:\/\/[^\]\|\s]*)\|([^\]\s]*)\]\]/g, "<a href='$2'><img data-name='$1' class='pull-$3' src='/public/missing.png' ></a>");
    result = result.replace(/\[\[bild\:([^\]\|]+)\|(http:\/\/[^\]\|\s]*)\]\]/g, "<a href='$2'><img data-name='$1' src='/public/missing.png' ></a>");
    result = result.replace(/\[\[bild\:([^\]\|]+)\|([^\]\|\s]*)\]\]/g, "<img data-name='$1' src='/public/missing.png' class='pull-$3' >");
    result = result.replace(/\[\[bild\:([^\]]+)\]\]/g, "<img data-name='$1' src='/public/missing.png'>");
    result = result.replace(/\[\[dokument\:([^\]]+)\]\]/g, "<span class='fa fa-file'></span><a data-name='$1' href='#'>Missing</a>");
    result = result.replace(/\[\[email\:([^\]]+)\]\]/g, "<a class='mailto' href='mailto:$1'>$1</a>");
    result = result.replace(/\[\[(http\:[^\]]+)\]\]/g, "<a href='$1'>$1</a>");
    result = result.replace(/\[\[(https\:[^\]]+)\]\]/g, "<a href='$1'>$1</a>");
    result = result.replace(/\[\[quote\:([^\]]+)\]\]/g, "<pre>$1</pre>");
    result = result.replace(/(\r\n|\n|\r)\*\-/g, "<br/>");
    result = result.replace(/\|\|([^\|\n]+)/g, "<th>$1</th>");
    result = result.replace(/\|([^\|\n]+)/g, "<td>$1</td>");
    result = result.replace(/\|/g, "");

    var lines = result.split("\n");
    var inCenter=false;
    lines = lines.map(function (line, idx) {
        var rueck = line;
        if (line.indexOf('][') === 0)
            rueck = "<center>"+line.substr(2)+"</center>";
        if (line.indexOf('***') === 0 || line.indexOf('###') === 0)
            rueck = "<li>" + line.substr(3) + "</li>";
        else if (line.indexOf('**') === 0 || line.indexOf('##') === 0)
            rueck = "<li>" + line.substr(2) + "</li>";
        else if (line.indexOf('*') === 0 || line.indexOf('#') === 0)
            rueck = "<li>" + line.substr(1) + "</li>";

        if (line.indexOf('*') === 0 && (idx === 0 || lines[idx - 1].indexOf('*') !== 0))
            rueck = "<ul>" + rueck;
        if (line.indexOf('*') !== 0 && (idx !== 0 && lines[idx - 1].indexOf('*') === 0))
            rueck = "</ul>" + rueck;
        if (line.indexOf('#') === 0 && (idx === 0 || lines[idx - 1].indexOf('#') !== 0))
            rueck = "<ol>" + rueck;
        if (line.indexOf('#') !== 0 && (idx !== 0 && lines[idx - 1].indexOf('#') === 0))
            rueck = "</ol>" + rueck;

        if (line.indexOf(' ') === 0 && (idx === 0 || lines[idx - 1].indexOf(' ') !== 0))
            rueck = "<pre>" + rueck;
        if (line.indexOf(' ') !== 0 && (idx !== 0 && lines[idx - 1].indexOf(' ') === 0))
            rueck = "</pre>" + rueck;

        if (line.indexOf('<th>') === 0 || line.indexOf('<td>') === 0)
            rueck = "<tr>" + rueck + "</tr>";

        if (line.indexOf('<t') === 0 && (idx === 0 || lines[idx - 1].indexOf('<t') !== 0))
            rueck = "<table class='table table-hover'>" + rueck;
        if (line.indexOf('<t') !== 0 && (idx !== 0 && lines[idx - 1].indexOf('<t') === 0))
            rueck = "</table>" + rueck;

        if (line === "") {
            rueck = "<br/>";
        }
        return rueck;
    });

    return "<p>" + lines.join("\n") + "</p>";
};
