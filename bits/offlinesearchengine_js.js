/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	+               OfflineSearchEngine JavaScript  v2.0                   +
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	+ Copyright (C) 2004-10 by Michael Loesler, http://derletztekick.com   +
	+                                                                      +
	+                                                                      +
	+ This program is free software; you can redistribute it and/or modify +
	+ it under the terms of the GNU General Public License as published by +
	+ the Free Software Foundation; either version 2 of the License, or    +
	+ (at your option) any later version.                                  +
	+                                                                      +
	+ This program is distributed in the hope that it will be useful,      +
	+ but WITHOUT ANY WARRANTY; without even the implied warranty of       +
	+ MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the        +
	+ GNU General Public License for more details.                         +
	+                                                                      +
	+ You should have received a copy of the GNU General Public License    +
	+ along with this program; if not, write to the                        +
	+ Free Software Foundation, Inc.,                                      +
	+ 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.            +
	+                                                                      +  
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
				

	var JSSearchEngine = {
		httpRequest : false,
		keyWords : new Array(),
		sites2search : new Array(),
		searchForm : null,
		tbody : null,
		pEl : null,
		index : 0,
		hasResult : false,
		searchrangestart : null,
		searchrangeend : null,
		searchMode : 1,
		fileContens : new Array(),
		firstSearch : true,
		UseHTTP_GET : false,
		init : function(start, end, uhg, s2s) {
			if (!(this.pEl = document.getElementById("searchresult")) || !(this.searchForm = document.forms["derletztekicksearchengine"]))
				return false;
			
			if (window.ActiveXObject) {
				try {
					this.httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
				} catch (e) {
					try {
						this.httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
					} catch (e) {
						window.alert("Fehler "+e);
						return false;
					}
				}
			}
			else if (window.XMLHttpRequest) 
				this.httpRequest = new XMLHttpRequest();
			
			this.searchrangestart = start==null?"<body>":start;
			this.searchrangeend = end==null?"</body>":end;
			
			this.UseHTTP_GET = uhg;
			
			if (typeof(s2s) == "object")
				this.sites2search = s2s;
			
			var querys = this.getParameters();
			if (this.UseHTTP_GET && querys != false && typeof(querys["q"]) != "undefined") {
				this.reset();
				this.searchForm.elements["q"].value = querys["q"].replace(/\+/g," ");

				if (typeof(querys["mode"]) != "undefined" && !isNaN(parseInt(querys["mode"])))
					this.searchForm.elements["mode"][ (parseInt(querys["mode"])>=this.searchForm.elements["mode"].length?0:parseInt(querys["mode"]))].checked = true;
				this.searchMode = this.getSearchMode();
				this.getKeywords();
				
				if (this.fileContens.length > 0)
					this.firstSearch = false;
				this.pEl.replaceChild(document.createTextNode(""), this.pEl.firstChild);
				if (this.keyWords.length > 0){
					this.createResultTable();
					this.searchPage();
				}
			}
			
			this.searchForm.Instanz = this;
			this.searchForm.onsubmit = function(e) {
				this.Instanz.reset();
				this.Instanz.searchMode = this.Instanz.getSearchMode();
				this.Instanz.getKeywords();
				
				if (this.Instanz.keyWords.length == 0){
					window.alert("Der Suchbegriff muss min. 3 Zeichen lang sein!");
					return false;
				}
				
				if (this.Instanz.UseHTTP_GET)
					return true;
					
				if (this.Instanz.fileContens.length > 0)
					this.Instanz.firstSearch = false;
				this.Instanz.pEl.replaceChild(document.createTextNode(""), this.Instanz.pEl.firstChild);
				
				if (this.Instanz.keyWords.length > 0){
					this.Instanz.createResultTable();
					this.Instanz.searchPage();
				}
				return false; 
			};
		},
		
		getParameters : function() {
			var q = window.location.search.substring(1).split('&');
			if(!q.length) 
				return false;
			var GET = new Object();
			for(var i=0; i<q.length; i++){
				var vars = q[i].split('=');
				try {
					GET[decodeURIComponent(vars[0])] = decodeURIComponent(vars[1]);
				}
				catch(e) {
					GET[unescape(vars[0])] = unescape(vars[1]);
				}
			}
			return GET;
		},
		
		reset : function() {
			this.index = 0;
			this.keyWords = new Array();
			this.hasResult = false;
		},
		
		getSearchMode : function() {
			for (var i=0; i<this.searchForm.elements["mode"].length; i++)
				if (this.searchForm.elements["mode"][i].checked)
					return i;
			return 0;
		},
		
		addResult : function() {
			var tr = document.createElement("tr");
			var td = document.createElement("td");
			if (this.index < this.sites2search.length) {
				var a  = document.createElement("a");
				a.appendChild(document.createTextNode( this.sites2search[this.index][1] ));
				a.href  = this.sites2search[this.index][1] + "?suchwort=" + this.replaceUmlauts(this.keyWords.join("&suchwort="), 1);
				a.title = this.sites2search[this.index][0];
				// Neue Zeile Start - SVCOE WEIS 20111114
				a.target = "_blank";
				// Neue Zeile Ende
				td.appendChild(document.createTextNode( this.sites2search[this.index][0] ));
				tr.appendChild(td);
				td = document.createElement("td");
				td.appendChild(a);
			}
			else if (!this.hasResult){
				td.colSpan = 2;
				td.appendChild(document.createTextNode("kein Treffer!"));
			}
			tr.appendChild(td);
			this.tbody.appendChild(tr);
			
		},
		
		createResultTable : function() {
			var table = document.createElement("table");
			var thead = document.createElement("thead");
			this.tbody = document.createElement("tbody");
			table.appendChild(thead);
			table.appendChild(this.tbody);
			
			var tr = document.createElement("tr");
			var th = document.createElement("th");
			th.appendChild(document.createTextNode("Seitentitel"));
			tr.appendChild(th);
			thead.appendChild(tr);

			var th = document.createElement("th");
			th.appendChild(document.createTextNode("Link"));
			tr.appendChild(th);
			thead.appendChild(tr);
			this.pEl.replaceChild(table, this.pEl.firstChild);
			
		},
		
		searchPage : function() {
			if (this.index == 0) {
				//window.alert("Beginne mit Suche");
				var img = new Image(43,11);
				img.src = "offlinesearchengine_loader.gif";
				img.id = "loader";
				img.alt = "Statusbalken";
				//this.pEl.appendChild(img);
				this.pEl.insertBefore(img, this.pEl.getElementsByTagName("table")[0]);
			}
			if (this.firstSearch && this.index < this.sites2search.length)
				this.sendRequest(this.sites2search[this.index][1],"GET", new Date().getTime());
			else if (!this.firstSearch) {
				for (var i=0; i<this.fileContens.length; i++, this.index++){
					if (this.isFound(this.fileContens[i])) {
						this.hasResult = true;
						this.addResult();
					}
				}
			}
			if (!this.hasResult && this.index >= this.sites2search.length){
				this.addResult();
				this.hasResult = true;
			}
			if (this.index == this.sites2search.length) {
				var img = this.pEl.getElementsByTagName("img")[0];
				if (img)
					this.pEl.removeChild(img);
				//window.alert("Ende der Suche");
			}
		},
		
		sendRequest : function(uri,m,q){
			try{
				this.httpRequest.abort();
				this.httpRequest.onreadystatechange = function() {	JSSearchEngine.handleAJAXResponse(); };
	
				if (m.toLowerCase() == "post"){
					this.httpRequest.open("POST", uri, true);
					this.httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					this.httpRequest.send( q );
				}
				else {
					this.httpRequest.open("GET", uri+"?"+q, true);
					this.httpRequest.send(null);
				}
			}
			catch(err) {
				window.alert("Die Seite "+uri+" konnte nicht geladen werden!\n\n"+err);
				this.sites2search.splice(this.index,1);
				var thisInstanz = this;
				window.setTimeout(function() { thisInstanz.searchPage(); } ,150);
			}			
		},
		
		handleAJAXResponse : function() {
			if (this.httpRequest.readyState == 4) {
				var str = this.httpRequest.responseText.toLowerCase();
				var spos = str.lastIndexOf( this.searchrangestart.toLowerCase() );
				var epos = str.indexOf( this.searchrangeend.toLowerCase() );
				spos = spos==-1?0:spos+this.searchrangestart.length;
				epos = epos<spos?str.length:epos;
				str = str.substring(spos, epos);
				str = this.replaceHTML(str);
				str = this.replaceUmlauts(str,0);
				this.fileContens.push( str );
				if (this.isFound(str)) {
					this.addResult();
					this.hasResult = true;
				}
				this.index++;
				var thisInstanz = this;
				window.setTimeout(function() { thisInstanz.searchPage(); } ,150);
			}
		}, 
		 
		isFound : function( fileContent ){
			for (var i=0,l=0; i<this.keyWords.length; i++){
				if (fileContent.search(this.keyWords[i].toLowerCase()) != -1){ //indexOf
					l++;
					if (this.searchMode!=0 && l > 0)
						return true;
					else if (this.searchMode==0 && l == (this.keyWords.length))
						return true;
				}
			}
			return false;
		},
		
		getKeywords : function() {
			if (this.searchMode==2)
				var kW = [decodeURIComponent(this.searchForm.elements['q'].value).replace(/\+/g," ")];
			else	
				var kW = decodeURIComponent(this.searchForm.elements['q'].value).replace(/\+/g," ").split(/\s+/);	
			for (var i=0; i<kW.length; i++)
				if (this.trim(kW[i]) != "" && kW[i].length > 2)
					this.keyWords.push(this.trim(this.replaceUmlauts(kW[i],0)));	
		},

		replaceUmlauts : function (str, k){
		    var arr = [	["Ö", "ö", "Ä", "ä", "Ü", "ü", "ß"],
						["&Ouml;", "ö", "&Auml;", "ä", "&Uuml;", "ü", "&szlig;"]];
		    
		    for (var i=0; i<arr[ (k==0?0:1) ].length; i++){
				myRegExp = new RegExp(arr[ (k==0?0:1) ][i],"g");
				str = str.replace(myRegExp, arr[(k==0?1:0)][i]);
			}
			str = str.replace(/&nbsp;/g, " ");
		    return str.replace (/\s+/g," ");
		},
		
		trim : function(str){
			return str.replace(/^\s*|\s*$/g, "");
		},
		
		replaceHTML : function(str){
			str = str.replace (/\<[\/\!]*?[^\<\>]*?\>/g," ");
			return str.replace (/\s+/g," ");
		}
	
	}
	
	var DOMContentLoaded = false;
	function addContentLoadListener (func) {
		if (document.addEventListener) {
			var DOMContentLoadFunction = function () {
				window.DOMContentLoaded = true;
				func();
			};
			document.addEventListener("DOMContentLoaded", DOMContentLoadFunction, false);
		}
		var oldfunc = (window.onload || new Function());
		window.onload = function () {
			if (!window.DOMContentLoaded) {
				oldfunc();
				func();
			}
		};
	}
	
	addContentLoadListener( function() { 
	JSSearchEngine.init("<content>", "</content>", true, [		['Willkommen beim Behörden-IT-Sicherheitstraining BITS', 'index.html'],
		['Suchmaschine', 'suche.htm'],
		['Ansprechpersonen ', 'allgemeines/ansprechpartner/index.htm'],
		['Dokumente &amp; Informationen', 'allgemeines/dokumente/index.htm'],
		['Informationen sind wertvoll', 'allgemeines/einleitung/index.htm'],
		['Helfen Sie mit, BITS aktuell zu halten', 'allgemeines/einleitung/mitmachen.htm'],
		['GNU GENERAL PUBLIC LICENSE', 'allgemeines/impressum/gnu.htm'],
		['Herausgeber', 'allgemeines/impressum/index.htm'],
		['Themenübersicht', 'lektionen/index.htm'],
		['Herzlichen Glückwunsch!', 'lektionen/arbeitsplatz/arbeitsplatz00.htm'],
		['Verhalten aller ist wichtig!', 'lektionen/arbeitsplatz/arbeitsplatz01.htm'],
		['Passwörter nicht weitergeben', 'lektionen/arbeitsplatz/arbeitsplatz02.htm'],
		['Zugang sichern', 'lektionen/arbeitsplatz/arbeitsplatz03.htm'],
		['Social Engineering-Angriffe abwehren', 'lektionen/arbeitsplatz/arbeitsplatz04.htm'],
		['Vorsicht bei mobilen Datenträgern ', 'lektionen/arbeitsplatz/arbeitsplatz05.htm'],
		['Verhalten im Schadensfall', 'lektionen/arbeitsplatz/arbeitsplatz06.htm'],
		['Verhalten am Arbeitsplatz ', 'lektionen/arbeitsplatz/index.htm'],
		['Herzlichen Glückwunsch!', 'lektionen/e-mail/e-mail00.htm'],
		['Was sind E-Mails?', 'lektionen/e-mail/e-mail01.htm'],
		['E-Mail ist Datenaustausch', 'lektionen/e-mail/e-mail02.htm'],
		['Übermittlung von E-Mails im Internet (1) ', 'lektionen/e-mail/e-mail03.htm'],
		['Übermittlung von E-Mail im Internet (2) ', 'lektionen/e-mail/e-mail03a.htm'],
		['Spam-E-Mails', 'lektionen/e-mail/e-mail04.htm'],
		['Schutz gegen Spam-E-Mails', 'lektionen/e-mail/e-mail04a.htm'],
		['Computerviren', 'lektionen/e-mail/e-mail07.htm'],
		['Schutz gegen Computerviren ', 'lektionen/e-mail/e-mail07a.htm'],
		['Phishing und Pharming', 'lektionen/e-mail/e-mail08.htm'],
		['Schutz gegen Phishing und Pharming', 'lektionen/e-mail/e-mail08a.htm'],
		['Fehlgeleitete Informationen', 'lektionen/e-mail/e-mail09.htm'],
		['„Erste Hilfe“ bei fehlgeleiteten Informationen ', 'lektionen/e-mail/e-mail09a.htm'],
		['Umgang mit vertraulichen Informationen und E-Mail-Verschlüsselung ', 'lektionen/e-mail/e-mail10.htm'],
		['Umgang mit vertraulichen Informationen und E-Mail-Verschlüsselung (2)', 'lektionen/e-mail/e-mail10a.htm'],
		['Umgang mit vertraulichen Informationen und E-Mail-Verschlüsselung (3)', 'lektionen/e-mail/e-mail10b.htm'],
		['Dienstliche und private Nutzung', 'lektionen/e-mail/e-mail10c.htm'],
		['Net(t)ikette ', 'lektionen/e-mail/e-mail11.htm'],
		['Zusammenfassung E-Mail Richtlinien', 'lektionen/e-mail/e-mail12.htm'],
		['Sicherer Umgang mit E-Mails&nbsp;', 'lektionen/e-mail/index.htm'],
		['Wissens-Check', 'lektionen/e-mail/test.htm'],
		['Wissens-Check E-Mail und E-Mail-Verschlüsselung durchgeführt', 'lektionen/e-mail/test00.htm'],
		['Wissens-Check', 'lektionen/e-mail/test02.htm'],
		['Wissens-Check', 'lektionen/e-mail/test03.htm'],
		['Wissens-Check', 'lektionen/e-mail/test04.htm'],
		['Wissens-Check', 'lektionen/e-mail/test05.htm'],
		['Surfen im Internet ', 'lektionen/internet/index.htm'],
		['Herzlichen Glückwunsch! ', 'lektionen/internet/internet00.htm'],
		['Was ist eigentlich das Internet? (1) ', 'lektionen/internet/internet01.htm'],
		['Was ist eigentlich das Internet? (2) ', 'lektionen/internet/internet01a.htm'],
		['Gefahren im Internet', 'lektionen/internet/internet02.htm'],
		['Vertrauenswürdigkeit von Web-Seiten', 'lektionen/internet/internet03.htm'],
		['Der gläserne Mensch ', 'lektionen/internet/internet04.htm'],
		['Technische Webinhalte', 'lektionen/internet/internet05.htm'],
		['Schutz vor technischen Webinhalten', 'lektionen/internet/internet05a.htm'],
		['Verschlüsselter Zugriff auf Webseiten (1) ', 'lektionen/internet/internet06.htm'],
		['Verschlüsselter Zugriff auf Webseiten (2)', 'lektionen/internet/internet06a.htm'],
		['Blocken krimineller Seiten', 'lektionen/internet/internet07.htm'],
		['Verwaltungsspezifische Richtlinien zur Internetnutzung ', 'lektionen/internet/internet08.htm'],
		['Wissens-Check', 'lektionen/internet/test.htm'],
		['Wissens-Check Surfen im Internet durchgeführt', 'lektionen/internet/test00.htm'],
		['Wissens-Check', 'lektionen/internet/test01.htm'],
		['Wissens-Check', 'lektionen/internet/test02.htm'],
		['Wissens-Check', 'lektionen/internet/test03.htm'],
		['Wissens-Check', 'lektionen/internet/test04.htm'],
		['Umgang mit mobilen Geräten, WLAN und USB-Sticks ', 'lektionen/mobile/index.htm'],
		['Herzlichen Glückwunsch! ', 'lektionen/mobile/mobile00.htm'],
		['Was sind Mobile Geräte?', 'lektionen/mobile/mobile01.htm'],
		['Besondere Gefahren und Risiken', 'lektionen/mobile/mobile02.htm'],
		['Moderne Kommunikationstechnologien', 'lektionen/mobile/mobile03.htm'],
		['WLAN - Wireless Local Area Network ', 'lektionen/mobile/mobile03a.htm'],
		['Notebooks', 'lektionen/mobile/mobile04.htm'],
		['Mobiltelefone und Smartphones', 'lektionen/mobile/mobile06.htm'],
		['Mobile Datenträger / Wechseldatenträger', 'lektionen/mobile/mobile07.htm'],
		['Mobile Datenträger / Wechseldatenträger', 'lektionen/mobile/mobile07a.htm'],
		['Zusammenfassung', 'lektionen/mobile/mobile08.htm'],
		['Wissens-Check', 'lektionen/mobile/test.htm'],
		['Wissens-Check Mobile Geräte, WLAN und USB-Sticks durchgeführt', 'lektionen/mobile/test00.htm'],
		['Wissens-Check', 'lektionen/mobile/test01.htm'],
		['Wissens-Check', 'lektionen/mobile/test02.htm'],
		['Wissens-Check', 'lektionen/mobile/test03.htm'],
		['Wissens-Check', 'lektionen/mobile/test04.htm'],
		['Passwörter: Ihr Zugangscode zu Daten und Systemen ', 'lektionen/passworte/index.htm'],
		['Herzlichen Glückwunsch!', 'lektionen/passworte/passworte00.htm'],
		['Warum Passwörter?', 'lektionen/passworte/passworte01.htm'],
		['Wo werden Passwörter verwendet?', 'lektionen/passworte/passworte02.htm'],
		['Wie sieht ein sicheres Passwort aus?', 'lektionen/passworte/passworte03.htm'],
		['Passwörter merken', 'lektionen/passworte/passworte04.htm'],
		['Richtiger Umgang mit Passwörtern', 'lektionen/passworte/passworte05.htm'],
		['Weitergabe von Passwörtern (1)', 'lektionen/passworte/passworte06.htm'],
		['Weitergabe von Passwörtern (2) ', 'lektionen/passworte/passworte06a.htm'],
		['Ausspionieren von Passwörtern ', 'lektionen/passworte/passworte07.htm'],
		['Social Engineering', 'lektionen/passworte/passworte08.htm'],
		['Schutz vor Social Engineering', 'lektionen/passworte/passworte09.htm'],
		['Passwort-Richtlinien ', 'lektionen/passworte/passworte10.htm'],
		['Wissens-Check', 'lektionen/passworte/test.htm'],
		['Wissens-Check Passwörter und Social Engineering durchgeführt', 'lektionen/passworte/test00.htm'],
		['Wissens-Check', 'lektionen/passworte/test01.htm'],
		['Wissens-Check', 'lektionen/passworte/test02.htm'],
		['Wissens-Check', 'lektionen/passworte/test03.htm'],
		['Wissens-Check', 'lektionen/passworte/test04.htm'],
		['Wissens-Check', 'lektionen/passworte/test05.htm'],
		['Wissens-Check', 'lektionen/passworte/test06.htm'],
		['Sichere Nutzung von Social Media-Diensten', 'lektionen/socialmedia/index.htm'],
		['Herzlichen Glückwunsch!', 'lektionen/socialmedia/socialmedia00.htm'],
		['Was sind Social Media?', 'lektionen/socialmedia/socialmedia01.htm'],
		['Typische Social Media-Dienste', 'lektionen/socialmedia/socialmedia02.htm'],
		['Geschäftsmodell bei Social Media', 'lektionen/socialmedia/socialmedia03.htm'],
		['Probleme bei Social Media (1)', 'lektionen/socialmedia/socialmedia04.htm'],
		['Probleme bei Social Media (2)', 'lektionen/socialmedia/socialmedia04a.htm'],
		['Social Media sicher nutzen', 'lektionen/socialmedia/socialmedia05.htm'],
		['Zusammenfassung', 'lektionen/socialmedia/socialmedia06.htm'],
		['Wissens-Check', 'lektionen/socialmedia/test.htm'],
		['Wissens-Check Social Media durchgeführt', 'lektionen/socialmedia/test00.htm'],
		['Wissens-Check', 'lektionen/socialmedia/test01.htm'],
		['Wissens-Check', 'lektionen/socialmedia/test02.htm'],
		['Wissens-Check', 'lektionen/socialmedia/test03.htm'],
		['Umgang mit vertraulichen Daten', 'lektionen/vertraulich/index.htm'],
		['Wissens-Check', 'lektionen/vertraulich/test.htm'],
		['Wissens-Check Vertrauliche Daten durchgeführt', 'lektionen/vertraulich/test00.htm'],
		['Wissens-Check', 'lektionen/vertraulich/test01.htm'],
		['Wissens-Check', 'lektionen/vertraulich/test02.htm'],
		['Wissens-Check', 'lektionen/vertraulich/test03.htm'],
		['Herzlichen Glückwunsch!', 'lektionen/vertraulich/vertraulich00.htm'],
		['Vertrauliche Daten', 'lektionen/vertraulich/vertraulich01.htm'],
		['Elektronische Datenverarbeitung', 'lektionen/vertraulich/vertraulich02.htm'],
		['Weiterleitung von Informationen', 'lektionen/vertraulich/vertraulich03.htm'],
		['Wie erkenne ich vertrauliche Daten?', 'lektionen/vertraulich/vertraulich04.htm'],
		['Schutz von Betriebs- und Dienstgeheimnissen (1)', 'lektionen/vertraulich/vertraulich04a.htm'],
		['Schutz von Betriebs- und Dienstgeheimnissen (2)', 'lektionen/vertraulich/vertraulich05.htm'],
		['Schutz von Betriebs- und Dienstgeheimnissen (3)', 'lektionen/vertraulich/vertraulich06.htm'],
		['Schutz von Betriebs- und Dienstgeheimnissen (4)', 'lektionen/vertraulich/vertraulich07.htm'],
		['Schutz von Betriebs- und Dienstgeheimnissen (5)', 'lektionen/vertraulich/vertraulich07a.htm'],
		['Behördliche(r) Datenschutzbeauftragte(r)', 'lektionen/vertraulich/vertraulich08.htm'],
		['Zusammenfassung', 'lektionen/vertraulich/vertraulich09.htm'],
		['Bedrohung durch Computerviren', 'lektionen/viren/index.htm'],
		['Wissens-Check', 'lektionen/viren/test.htm'],
		['Wissens-Check Computer-Viren durchgeführt', 'lektionen/viren/test00.htm'],
		['Wissens-Check', 'lektionen/viren/test01.htm'],
		['Wissens-Check', 'lektionen/viren/test02.htm'],
		['Wissens-Check', 'lektionen/viren/test03.htm'],
		['Wissens-Check', 'lektionen/viren/test04.htm'],
		['Herzlichen Glückwunsch! ', 'lektionen/viren/viren00.htm'],
		['Was ist eigentlich ein Computervirus?', 'lektionen/viren/viren01.htm'],
		['Hohe Artenvielfalt', 'lektionen/viren/viren02.htm'],
		['Mögliche Schäden durch Virenbefall (1)', 'lektionen/viren/viren03.htm'],
		['Mögliche Schäden durch Virenbefall (2) ', 'lektionen/viren/viren03a.htm'],
		['Mögliche Schäden durch Virenbefall (3) ', 'lektionen/viren/viren03b.htm'],
		['Infektionswege (1)', 'lektionen/viren/viren04.htm'],
		['Infektionswege (2)', 'lektionen/viren/viren04a.htm'],
		['Risiken und Schäden (1) ', 'lektionen/viren/viren05.htm'],
		['Risiken und Schäden (2) ', 'lektionen/viren/viren05a.htm'],
		['Vorbeugemaßnahmen gegen Virenbefall (1) ', 'lektionen/viren/viren06.htm'],
		['Vorbeugemaßnahmen gegen Virenbefall (2) ', 'lektionen/viren/viren06a.htm'],
		['Virenbefall - Was tun?', 'lektionen/viren/viren07.htm'],
		['Zusammenfassung', 'lektionen/viren/viren08.htm']
		] ); } );	

/*
 	addContentLoadListener( function() {
 sites[0] = new Array('Ansprechpartner', 'index.htm');
 		JSSearchEngine.init("<div id="content">", "</body">", true, sites);} );	
*/
 