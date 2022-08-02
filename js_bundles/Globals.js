/*jslint plusplus: true, sloppy: true, indent: 4 */

//Check to see if a langauge was set in the config file, if it isn't, set to default (English).
if (typeof lang === "undefined") {
    lang = "en";
}

//Set Moment.js Langauge
moment.locale(lang);

//Dictionary
var dict = {
	apparentTitle: {
		en: "Apparent",
		de: "Gefühlt",
		nl: "Schijnbare",
		da: "Føles som",
		ro: "Aparentă",
		fr: "Ressenti",
		gr: "Εμφανής",
		it: "Apparente",
		es: "Aparente",
		nb: "Tilsynelatende",
		bg: "Усеща се",
		cs: "Zdánlivá",
		si: "Naslovnica",
		fi: "Tuntuu kuin",
		sv: "Känns som",
		pt: "Aparente",
		ca: "Aparent"
	},
	apparentDescription: {
		en: "Perceived temperature based on temperature, humidity, sun, and wind.",
		de: "Wahrgenommene Temperatur basierend auf Temperatur, Luftfeuchtigkeit, Sonne und Wind.",
		nl: "Waargenomen temperatuur gebaseerd op de temperatuur, vochtigheid, zon en wind.",
		da: "Opfattet temperatur baseret på temperatur, fugtighed, sol og vind",
		ro: "Temperatura percepută în funcție de temperatură, umiditate, soare şi vânt.",
		fr: "Température perçue en fonction de la température, de l'humidité, du soleil et du vent.",
		gr: "Θεωρημένη θερμοκρασία με βάση τη θερμοκρασία, την υγρασία, τον ήλιο και τον άνεμο.",
		it: "Temperatura percepita basata su temperatura, umidità, sole e vento.",
		es: "Temperatura percibida en función de la temperatura, la humedad, el sol y el viento.",
		nb: "Oppfattet temperatur basert på temperatur, fuktighet, sol og vind.",
		bg: "Реално усещана температура, базирана на текущите температура, влажност, слънчева радиация и вятър.",
		cs: "Pocitová teplota na základě teploty, vlhkosti, slunce a větru.",
		si: "Zaznana temperatura, ki temelji na temperaturi, vlagi, soncu in vetru.",
		fi: "Koettu lämpötila perustuu lämpötilaan, kosteuteen, aurinkoon ja tuuleen.",
		sv: "Upplevd temperatur, baserad på temperatur, fuktighet, sol och vind.",
		pt: "Temperatura aparente baseada na temperatura, humidade, sol e vento.",
		ca: "Temperatura percebuda en funció de la temperatura, l'humitat, el sol i el vent."
	},
	temperatureTitle: {
		en: "Temperature",
		de: "Temperatur",
		nl: "Temperatuur",
		da: "Temperatur",
		ro: "Temperatura",
		fr: "Température",
		gr: "Θερμοκρασία",
		it: "Temperatura",
		es: "Temperatura",
		nb: "Temperatur",
		bg: "Температура",
		cs: "Teplota",
		si: "Temperatura",
		fi: "Lämpötila",
		sv: "Temperatur",
		pt: "Temperatura",
		ca: "Temperatura"
	},
	temperatureDescription: {
		en: "Current air temperature.\nBlue: Low daily temperature.\nRed: High daily temperature.",
		de: "Aktuelle Lufttemperatur.\nBlau: Min. Tagestemperatur.\nRot: Max. Tagestemperatur.",
		nl: "Huidige luchttemperatuur. \nBlauw: Minimum dagelijkse temperatuur. \nRood: Maximum dagelijkse temperatuur.",
		da: "Aktuel lufttemperatur. \nBlå: Laveste daglige temperatur.\nRød: Højeste daglige temperatur.",
		ro: "Temperatura aerului curent.\nAlbastru: temperatura zilnică minimă.\nRosu: Temperatura zilnică maximă.",
		fr: "Température actuelle de l'air.\nBleu : Température la plus basse du jour.\nRouge : Température la plus haute du jour.",
		gr: "Τρέχουσα θερμοκρασία αέρα.\nΜπλε: Χαμηλή ημερήσια θερμοκρασία.\nκόκκινος: Υψηλή ημερήσια θερμοκρασία.",
		it: "Temperatura dell'aria attuale.\nBlu: temperatura giornaliera bassa.\nRosso: temperatura giornaliera elevata.",
		es: "Temperatura del aire actual.\nAzul: temperatura diaria minima.\nRojo: temperatura diaria máxima.",
		nb: "Gjeldene temperatur.\nBlå: Lavest måling i dag.\nRød: Høyest måling i dag.",
		bg: "Текуща температура на въздуха.\nСиньо: Минимална температура за деня.\nЧервено: Максимална температура за деня.",
		cs: "Aktuální teplota vzduchu.\nModrá: Nejnižší denní teplota.\nČervené: Nejvyšší denní teplota.",
		si: "Trenutna temperatura zraka. \nModra: nizka dnevna temperatura. \nRdeča: visoka dnevna temperatura.",
		fi: "Tämänhetkinen ilman lämpötila.\nSininen: Päivän alin lämpötila.\nPunainen: Päivän ylin lämpötila.",
		sv: "Aktuell temperatur.\nBlå: Lägsta dagliga temperatur. \nRöd: Högsta dagliga temperatur.",
		pt: "Temperatura do ar atual.\nAzul: Temperatura diária mínima.\nVermelho: Temperatura diária máxima.",
		ca: "Temperatura de l'aire actual.\nBlau: temperatura diària mínima.\nVermell: temperatura diària màxima."
	},
	barometerSteady: {
		en: "Steady",
		de: "gleichbleibend",
		nl: "Bestendig",
		da: "Stabil",
		ro: "Constantă",
		fr: "Stable",
		gr: "Σταθερά",
		it: "Costante",
		es: "Estable",
		nb: "Stabil",
		bg: "Застой",
		cs: "Stabilní",
		si: "Stabilno",
		fi: "Vakaa",
		sv: "Stabil",
		pt: "Estável",
		ca: "Estable"
	},
	barometerRate: {
		en: "Rate",
		de: "Rate",
		nl: "Trend",
		da: "Hastighed",
		ro: "Rata",
		fr: "Tendance",
		gr: "Τιμή",
		it: "Vota",
		es: "Velocidad",
		nb: "Endring",
		bg: "Тренд",
		cs: "Změna",
		si: "Razmerje",
		fi: "Nopeus",
		sv: "Hastighet",
		pt: "Variação",
		ca: "Velocitat"
	},
	barometerTitle: {
		en: "Barometer",
		de: "Barometer",
		nl: "Barometer",
		da: "Barometer",
		ro: "Barometrul",
		fr: "Baromètre",
		gr: "Βαρόμετρο",
		it: "Barometro",
		es: "Barometro",
		nb: "Barometer",
		bg: "Барометър",
		cs: "Tlakoměr",
		si: "Barometer",
		fi: "Ilmanpaine",
		sv: "Barometer",
		pt: "Barómetro",
		ca: "Baròmetre"
	},
	barometerDescription: {
		en: "The weight of the air, adjusted for the station's altitude.",
		de: "Der Luftdruck,angepasst an die Höhe der Station.",
		nl: "Het gewicht van de lucht, aangepast naar de hoogte van het weerstation.",
		da: "Luftens vægt, justeret efter vejrstationens højde",
		ro: "Greutatea aerului, ajustată la altitudinea stației.",
		fr: "Le poids de l'air, ajusté pour l'altitude de la station.",
		gr: "Το βάρος του αέρα, προσαρμοσμένο στο υψόμετρο του σταθμού.",
		it: "Il peso dell'aria, regolato per l'altitudine della stazione.",
		es: "El peso del aire, ajustado para la altitud de la estación.",
		nb: "Vekten av luften, justert for stasjonens høyde.",
		bg: "Атмосферно налягане, коригирано спрямо височината на станцията (приведено).",
		cs: "Tlak vzduchu, přizpůsobený nadmořské výšce stanice.",
		si: "Teža zraka, prilagojena višini postaje.",
		fi: "Ilmanpaine perustuen sääaseman korkeuteen merenpinnasta.",
		sv: "Lufttrycket baserat på väderstationens höjd över havet.",
		pt: "O peso do ar, ajustado à altitude da estação.",
		ca: "El pes de l'aire, ajustat per a l'altitud de l'estació."
	},
	windchillTitle: {
		en: "Windchill",
		de: "Windchill",
		nl: "Gevoelstemperatuur",
		da: "Kuldeindeks",
		ro: "Vânt tăios",
		fr: "Facteur vent",
		gr: "Δείκτης Ψύχρας",
		it: "Percepita",
		es: "Escalofríos",
		nb: "Vind faktor",
		bg: "Уиндчил",
		cs: "Faktor větru",
		si: "Hladen veter",
		fi: "Tuulen hyytävyys",
		sv: "Köldindex",
		pt: "Índice de frio",
		ca: "Sensació"
	},
	windchillDescription: {
		en: "How cold it actually feels. Calculated by combining heat and wind speed.",
		de: "Gefühlte Kälte. Berechnet durch Kombination von Temperatur und Windgeschwindigkeit.",
		nl: "Hoe koud het daadwerkelijk aanvoelt. Wordt berekend door een combinatie van temperatuur en windsnelheid.",
		da: "Hvor koldt det føles. Beregnet ved at kombinere temperatur og vindhastighed.",
		ro: "Cât de frig se simte de fapt. Se calculează prin combinarea temperaturii și a vitezei vântului.",
		fr: "C'est la sensation de froid ressentie. Calculée en combinant la température actuelle et la vitesse du vent.",
		gr: "Πόσο κρύο αισθάνεται πραγματικά. Υπολογίζεται συνδυάζοντας τη θερμότητα και την ταχύτητα του ανέμου.",
		it: "Come fa veramente freddo, calcolato combinando il calore e la velocità del vento.",
		es: "Qué frío se siente realmente. Calculado combinando el calor y la velocidad del viento.",
		nb: "Hvor kaldt det føles. Beregnet ut fra temperatur og vindhastighet.",
		bg: "Колко студено се усеща реално. Изчислено чрез комбиниране на температурата и скоростта на вятъра.",
		cs: "Jak je teplota skutečně vnímána. Vypočítá se kombinací teploty a rychlosti větru.",
		si: "Kako hladno se dejansko počuti. Izračunano s kombinacijo toplote in hitrosti vetra.",
		fi: "Koettu lämpötila lasketaan yhdistämällä lämpötila ja tuulen nopeus.",
		sv: "Upplevd temperatur. Baserad på en kombination av temperatur och vindhastighet.",
		pt: "Temperatura percetível. Calculado combinando a temperatura e a velocidade do vento.",
		ca: "Quin fred se sent realment. Calculat combinant el calor y la velocitat del vent."
	},
	humidityTitle: {
		en: "Humidity",
		de: "Luftfeuchtigkeit",
		nl: "Vochtigheid",
		da: "Luftfugtighed",
		ro: "Umiditatea",
		fr: "Humidité",
		gr: "Υγρασία",
		it: "Umidità",
		es: "Humedad",
		nb: "Fuktighet",
		bg: "Отн. влажност",
		cs: "Vlhkost",
		si: "Vlažnosr",
		fi: "Ilman kosteus",
		sv: "Luftfuktighet",
		pt: "Humidade",
		ca: "Humitat"
	},
	humidityDescription: {
		en: "The amount of water vapour in the air as a percentage of the amount the air is capable of holding.",
		de: "Die Menge an Wasserdampf in der Luft als Prozentsatz der Menge, die die Luft aufnehmen kann.",
		nl: "De hoeveelheid verdampt water in de lucht als een percentage van de hoeveelheid lucht dat in staat is om vocht vast te houden.",
		da: "Mængden af vanddamp i luften som en procent af den mængde luften er i stand til at indeholde",
		ro: "Cantitatea de vapori de apă din aer ca procent din cantitatea de aer care poate fi menținută.",
		fr: "La quantité de vapeur d'eau dans l'air en pourcentage de la quantité que l'air est capable de contenir.",
		gr: "Η ποσότητα υδρατμών στον αέρα ως ποσοστό της ποσότητας που μπορεί να συγκρατήσει ο αέρας.",
		it: "La quantità di vapore acqueo nell'aria in percentuale della quantità di aria che è in grado di trattenere.",
		es: "La cantidad de vapor de agua en el aire como un porcentaje de la cantidad que el aire es capaz de contener.",
		nb: "En prosentandel av mengden vanndamp luften kan holde.",
		bg: "Относителна влажност: Количеството водна пара във въздуха като процент от максимално възможното при тази температура.",
		cs: "Množství vodní páry ve vzduchu jako procento max. množství, které může vzduch obsahovat.",
		si: "Količina vodne pare v zraku kot odstotek količine, ki jo lahko zadrži zrak.",
		fi: "Ilman kosteus on prosentuaalinen vesihöyryn määrä siitä määrästä, joka ilmassa enintään voi vallitsevassa lämpötilassa olla.",
		sv: "Luftfuktighet är ett mått på mängden eller andelen vattenånga som finns i luften.",
		pt: "A quantidade de vapor de água no ar, como percentagem do total passível de ser retido pelo ar à temperatura atual.",
		ca: "La quantitat de vapor d'aigua en l'aire com a percentatge de la quantitat que l'aire es capaç de contenir."
	},
	moonSunRise: {
		en: "Rise",
		de: "Aufgang",
		nl: "Opkomst",
		da: "Opgang",
		ro: "Răsărit de soare",
		fr: "Lever",
		gr: "Ανατολή Ηλίου",
		it: "Alba",
		es: "Amanecer",
		nb: "Opp",
		bg: "Изгрев",
		cs: "Východ",
		si: "Vzhod",
		fi: "Nousu",
		sv: "Uppgång",
		pt: "Nascer",
		ca: "Sortida"
	},
	moonSunSet: {
		en: "Set",
		de: "Untergang",
		nl: "Ondergang",
		da: "Nedgang",
		ro: "Apus",
		fr: "Coucher",
		gr: "Δύση Ηλίου",
		it: "Tramonto",
		es: "Puesta",
		nb: "Ned",
		bg: "Залез",
		cs: "Západ",
		si: "Zahod",
		fi: "Lasku",
		sv: "Nedgång",
		pt: "Pôr",
		ca: "Posta"
	},
	moonSunPhase: {
		en: "Phase",
		de: "Phase",
		nl: "Fase",
		da: "Fase",
		ro: "Faza",
		fr: "Phase",
		gr: "Φάση",
		it: "Fase",
		es: "Fase",
		nb: "Fase",
		bg: "Фаза",
		cs: "Fáze",
		si: "Faza",
		fi: "Vaihe",
		sv: "Fas",
		pt: "Fase",
		ca: "Fase"
	},
	moonSunAge: {
		en: "Age",
		de: "Alter",
		nl: "Leeftijd",
		da: "Alder",
		ro: "Vârsta",
		fr: "Age",
		gr: "ηλικία",
		it: "Età",
		es: "Edad",
		nb: "Alder",
		bg: "Възраст",
		cs: "Stáří",
		si: "Starost",
		fi: "Ikä",
		sv: "Ålder",
		pt: "Dias",
		ca: "Edat"
	},
	moonSunTitleSun: {
		en: "Sun",
		de: "Sonne",
		nl: "Zon",
		da: "Sol",
		ro: "Soarele",
		fr: "Soleil",
		gr: "Ήλιος",
		it: "Sole",
		es: "Sol",
		nb: "Sol",
		bg: "Cлънце",
		cs: "Slunce",
		si: "Sonce",
		fi: "Aurinko",
		sv: "Sol",
		pt: "Sol",
		ca: "Sol"
	},
	moonSunTitleMoon: {
		en: "Moon",
		de: "Mond",
		nl: "Maan",
		da: "Måne",
		ro: "Luna",
		fr: "Lune",
		gr: "Σελήνη",
		it: "Luna",
		es: "Luna",
		nb: "Måne",
		bg: "Луна",
		cs: "Měsíc",
		si: "Luna",
		fi: "Kuu",
		sv: "Måne",
		pt: "Lua",
		ca: "Lluna"
	},
	solarTitle: {
		en: "Solar",
		de: "Solar",
		nl: "Zonkracht",
		da: "Solindstråling",
		ro: "Solar",
		fr: "Solaire",
		gr: "Ηλιακός",
		it: "Solare",
		es: "Solar",
		nb: "Solstråling",
		bg: "Солар",
		cs: "Sluneční svit",
		si: "Sončna energija",
		fi: "Aurinko",
		sv: "Solstrålning",
		pt: "Solar",
		ca: "Solar"
	},
	solarSunHours: {
		en: "Sun Hours",
		de: "Sonnenstunden",
		nl: "Zonuren",
		da: "Solskinstimer",
		ro: "Ore însorite",
		fr: "Heures du soleil",
		gr: "Ώρες Κυρ",
		it: "Ore di sole",
		es: "Horas de sol",
		nb: "Sol timer",
		bg: "Сл. часове",
		cs: "Doba svitu slunce",
		si: "Sončev čas",
		fi: "Auringonpaiste",
		sv: "Soltimmar",
		pt: "Horas de sol",
		ca: "Hores de Sol"
	},
	solarDescription: {
		en: "The intensity of the sun's radiation.",
		de: "Die Intensität der Sonnenstrahlung.",
		nl: "De intensiteit van de straling van de zon.",
		da: "Intensiteten af solens stråler",
		ro: "Intensitatea radiației solare.",
		fr: "L'intensité du rayonnement solaire",
		gr: "Η ένταση της ακτινοβολίας του ήλιου.",
		it: "L'intensità della radiazione solare.",
		es: "La intensidad de la radiación del sol.",
		nb: "Intensiteten av solens stråling.",
		bg: "Интензитет на слънчевата радиация.",
		cs: "Intenzita slunečního záření.",
		si: "Intenzivnost sončnega sevanja.",
		fi: "Auringon säteilyn voimakkuus.",
		sv: "Solintensitet.",
		pt: "A intensidade da radiação solar.",
		ca: "La intensitat de la radiació del Sol."
	},
	statusNoDataSince: {
		en: "No data since",
		de: "keine Daten seit",
		nl: "Geen data sinds",
		da: "Ingen data siden",
		ro: "Nu există date încă",
		fr: "Aucune donnée depuis",
		gr: "Δεν υπάρχουν δεδομένα από τότε",
		it: "Nessun dato da",
		es: "Sin datos desde",
		nb: "Ingen data siden",
		bg: "Няма данни от",
		cs: "Žádné údaje od té doby",
		si: "Ni podatkov od",
		fi: "Ei tietoja sitten",
		sv: "Ingen data sedan",
		pt: "Sem dados desde",
		ca: "Sense dades des de"
	},
	statusDataAt: {
		en: "Latest data received at",
		de: "Letzte Daten empfangen am",
		nl: "Laatste data ontvangen op",
		da: "Sidste opdatering kl.",
		ro: "Ultimele date primite la",
		fr: "Dernières données reçues à",
		gr: "Τα τελευταία δεδομένα που ελήφθησαν στο",
		it: "Ultimi dati ricevuti a",
		es: "Últimos datos recibidos en",
		nb: "Sist oppdatert",
		bg: "Последни данни получени в",
		cs: "Nejnovější hodnoty získané ze stanice",
		si: "Najnovejši podatki, prejeti ob",
		fi: "Viimeisimmät tiedot vastaanotettu",
		sv: "Senaste uppdatering vid kl.",
		pt: "Últimos dados recebidos em",
		ca: "Últimes dades rebudes"
	},
	statusDescription: {
		en: "Green: New data collected from server.\nGrey: Data on server hasn't changed.\nYellow: Some error during data collection from server.\nRed: No data able to be collected from server.",
		de: "Grün: Neue Daten vom Server.\nGrau: Die Daten auf dem Server haben sich nicht geändert.\nGelb: Einige Fehler bei der Datenerfassung vom Server.\nRot: Es können keine Daten vom Server erfasst werden.",
		nl: "Groen: Nieuwe data ontvangen van server. \nGrijs: Data op server is niet veranderd. \nGeel: Een foutmelding tijdens de ontvangst van de data van de server. \nRood: Geen data beschikbaar om te ontvangen van de server.",
		da: "Grøn: Friske data fra serveren.\nGrå: Data på serveren har ikke ændret sig.\nGul: Fejl under hentning af data fra serveren.\nRød: Ingen data fra serveren.",
		ro: "Verde: date noi colectate de pe server.\nVerde: datele de pe server nu s-au schimbat. \nGalben: Unele erori în timpul colectării de date de pe server.\nRosu: Nu există date care să poată fi colectate de pe server.",
		fr: "Vert : Nouvelles données collectées sur le serveur.\nGris : Les données sur le serveur n'ont pas changées.\nJaune : Erreur lors de la collecte des données du serveur.\nRouge : Aucune donnée ne peut être collectée sur le serveur.",
		gr: "Πράσινο: Νέα δεδομένα που έχουν συλλεχθεί από το διακομιστή.\nγκρί: Τα δεδομένα στο διακομιστή δεν έχουν αλλάξει.\nκίτρινος: Ορισμένα σφάλματα κατά τη συλλογή δεδομένων από το διακομιστή.\nκόκκινος: Δεν υπάρχουν δεδομένα που μπορούν να συλλεχθούν από το διακομιστή.",
		it: "Verde: nuovi dati raccolti dal server.\nGrigio: i dati sul server non sono cambiati.\nGlialo: alcuni errori durante la raccolta dei dati dal server.\nRosso: nessun dato può essere raccolto dal server.",
		es: "Verde: datos nuevos recopilados del servidor.\nGris: los datos en el servidor no han cambiado.\nAmarillo: algunos errores durante la recopilación de datos del servidor.\nRojo: no se pueden recopilar datos del servidor.",
		nb: "Grønn: Ny infomasjon er hentet fra værstasjon.\nGrå: Ingen forandringer.\nGul: Noen feil under datainnsamling fra værstasjon.\nRød: Ikke mulig å samle inn ny data fra værstasjon.",
		bg: "Зелено: Получени са нови данни от сървъра.\nСиво: Данните на сървъра не са се променили.\nЖълто: Грешка при получаването на данни от сървъра.\nЧервено: Невъзможност за получаване на данни от сървъра.",
		cs: "Zelená: Nová data načtená ze serveru.\nŠedá: Údaje na serveru se nezměnily.\nŽlutá: Některé chyby při sběru dat ze serveru.\nČervená: Žádné údaje nemohly být ze serveru načteny.",
		si: "Zelena: novi podatki, zbrani s strežnika. \nSiva: Podatki na strežniku se niso spremenili. \nRumena: Nekatere napake med zbiranjem podatkov s strežnika. \nRdeča: Ni podatkov, ki bi jih bilo mogoče uporabiti s strežnika.",
		fi: "Vihreä: Viimeisimmät tiedot kerätty palvelimelta.\nHarmaa: Palvelimen tiedot eivät ole muuttuneet.\nKeltainen: Joitain virheitä kerätessä tietoja palvelimelta.\nPunainen: Tietoja ei voitu kerätä palvelimelta.",
		sv: "Grön: Ny data mottagen från servern. \nGrå: Ingen ändring av mottagen data från servern. \nGul: Fel uppstod vid hämtning av data från servern.\nRöd: Ingen data tillgänglig från servern.",
		pt: "Verde: Novos dados recolhidos do servidor.\nCinzento: Dados do servidor não alterados.\nAmarelo: Alguns erros durante a recolha de dados do servidor.\nVermelho: Não foi possível recolher dados do servidor.",
		ca: "Vert: dades noves recopilades del servidor.\nGris: les dades del servidor no han canviat.\nGroc: alguns errors durant la recopilació de dades del servidor.\nVermell: no es poden recopilar dades del servidor."
	},
	rainfallTitle: {
		en: "Rainfall",
		de: "Regen",
		nl: "Regen",
		da: "Regn",
		ro: "Precipitaţii",
		fr: "Précipitations",
		gr: "Βροχή",
		it: "Precipitazioni",
		es: "Lluvia",
		nb: "Nedbør",
		bg: "Валежи",
		cs: "Srážky",
		si: "Padavine",
		fi: "Sademäärä",
		sv: "Nederbörd",
		pt: "Pluviosidade",
		ca: "Pluja"
	},
	rainfallDailyTitle: {
		en: "Daily",
		de: "Täglicher",
		nl: "Vandaag",
		da: "Daglig",
		ro: "Ziua",
		fr: "Jour",
		gr: "Καθημερινά",
		it: "Quotidiano",
		es: "Día",
		nb: "Dag",
		bg: "За деня",
		cs: "Denní",
		si: "Dnevno",
		fi: "Päivän",
		sv: "Daglig",
		pt: "Diária",
		ca: "Dia"
	},
	rainfallMonthlyTitle: {
		en: "Monthly",
		de: "Monatlicher",
		nl: "Deze Maand",
		da: "Månedlig",
		ro: "Lunar",
		fr: "Mois",
		gr: "Μηνιαίος",
		it: "Mensile",
		es: "Mensual",
		nb: "Måned",
		bg: "Месечни",
		cs: "Měsíční",
		si: "Mesečno",
		fi: "Kuukauden",
		sv: "Månatligt",
		pt: "Mensal",
		ca: "Mensual"
	},
	rainfallAnnualTitle: {
		en: "Annual",
		de: "Jährlicher",
		nl: "Jaar Totaal",
		da: "Årlig",
		ro: "Anual",
		fr: "Année",
		gr: "Ετήσιος",
		it: "Annuale",
		es: "Anual",
		nb: "År",
		bg: "Годишни",
		cs: "Roční",
		si: "Letno",
		fi: "Vuoden",
		sv: "Årlig",
		pt: "Anual",
		ca: "Anual"
	},
	uvTitle: {
		en: "UV",
		nl: "UV",
		da: "UV",
		ro: "UV",
		fr: "UV",
		gr: "UV",
		it: "UV",
		es: "UV",
		nb: "UV",
		bg: "UV",
		cs: "UV",
		si: "UV",
		fi: "UV",
		sv: "UV",
		pt: "UV",
		ca: "UV"
	},
	uvDescription: {
		en: "The intensity of UV radiation - 0-2 is minimal risk of skin damage whilst 8+ is very high.",
		de: "Die Intensität der UV-Strahlung - 0-2 ist ein minimales Risiko für Hautschäden, während 8+ sehr hoch ist.",
		nl: "De intensiteit van de UV straling - 0-2 is een minimaal risico op huidschade terwijl 8+ een hoog risico vormt.",
		da: "Intensiteten af UV stråling - 0-2 angiver minimal risiko for hudskader mens 8+ angiver meget høj risiko.",
		ro: "Intensitatea radiației UV - 0-2 reprezintă un risc minim de afectare a pielii, în timp ce 8+ este foarte mare.",
		fr: "L'intensité du rayonnement UV - 0 à 2 est un risque minime de dommages cutanés, tandis que 8 et + est très élevé.",
		gr: "Η ένταση της ακτινοβολίας UV - 0-2 είναι ο ελάχιστος κίνδυνος βλάβης του δέρματος ενώ το 8+ είναι πολύ υψηλό.",
		it: "L'intensità della radiazione UV - 0-2 è il minimo rischio di danni alla pelle mentre 8+ è molto alta.",
		es: "La intensidad de la radiación UV - 0-2 es un riesgo mínimo de daño a la piel, mientras que 8+ es muy alta.",
		nb: "Intensiteten til UV-stråling - 0-2 er minimal risiko for hudskade, mens 8+ er veldig høy.",
		bg: "Интензитет на UV радиацията - при 0-2 - минимален риск за увреждане на кожата, а при 8+ - много висок риск.",
		cs: "Intenzita UV záření - 0-2 představuje minimální riziko poškození kůže, zatímco 8+ je velmi vysoké riziko.",
		si: "Intenzivnost UV sevanja - 0-2 je minimalna nevarnost poškodb kože, medtem ko je 8 + zelo visoka.",
		fi: "UV-säteilyn voimakkuus - 0-2 on vähäinen ihon vaurioituminen, kun taas 8+ on erittäin korkea.",
		sv: "Intensiteten av UV-strålningen. 0-2 = minimal risk för hudskador. Medan 8+ betyder hög risk för hudskador.",
		pt: "Intensidade de radiação Ultravioleta - 0 a 2 o risco de danos na pele é mínimo enquanto que mais de 8 é muito alto.",
		ca: "La intensitat de la radiació UV - 0-2 és un risc mínim de dany a la pell, mentre que 8+ és molt alta."
	},
	windDirectionLabelN: {
		en: "N",
		de: "N",
		nl: "N",
		da: "N",
		ro: "N",
		fr: "N",
		gr: "B",
		it: "N",
		es: "N",
		nb: "N",
		bg: "С",
		cs: "S",
		si: "S",
		fi: "Pohjoinen",
		sv: "N",
		pt: "N",
		ca: "N"
	},
	windDirectionLabelNE: {
		en: "NE",
		de: "NO",
		nl: "NO",
		da: "NØ",
		ro: "NE",
		fr: "NE",
		gr: "BA",
		it: "NE",
		es: "NE",
		nb: "NØ",
		bg: "СИ",
		cs: "SV",
		si: "SV",
		fi: "Koillinen",
		sv: "NO",
		pt: "NE",
		ca: "NE"
	},
	windDirectionLabelE: {
		en: "E",
		de: "O",
		nl: "O",
		da: "Ø",
		ro: "E",
		fr: "E",
		gr: "A",
		it: "E",
		es: "E",
		nb: "Ø",
		bg: "И",
		cs: "V",
		si: "V",
		fi: "Itä",
		sv: "Ö",
		pt: "E",
		ca: "E"
	},
	windDirectionLabelSE: {
		en: "SE",
		de: "SO",
		nl: "ZO",
		da: "SØ",
		ro: "SE",
		fr: "SE",
		gr: "NA",
		it: "SE",
		es: "SE",
		nb: "SØ",
		bg: "ЮИ",
		cs: "JV",
		si: "JV",
		fi: "Kaakko",
		sv: "SO",
		pt: "SE",
		ca: "SE"
	},
	windDirectionLabelS: {
		en: "S",
		de: "S",
		nl: "Z",
		da: "S",
		ro: "S",
		fr: "S",
		gr: "N",
		it: "S",
		es: "S",
		nb: "S",
		bg: "Ю",
		cs: "J",
		si: "J",
		fi: "Etelä",
		sv: "S",
		pt: "S",
		ca: "S"
	},
	windDirectionLabelSW: {
		en: "SW",
		de: "SW",
		nl: "ZW",
		da: "SV",
		ro: "SV",
		fr: "SO",
		gr: "NΔ",
		it: "SO",
		es: "SO",
		nb: "SV",
		bg: "ЮЗ",
		cs: "JZ",
		si: "JZ",
		fi: "Lounas",
		sv: "SV",
		pt: "SO",
		ca: "SO"
	},
	windDirectionLabelW: {
		en: "W",
		de: "W",
		nl: "W",
		da: "V",
		ro: "V",
		fr: "O",
		gr: "Δ",
		it: "O",
		es: "O",
		nb: "V",
		bg: "З",
		cs: "Z",
		si: "Z",
		fi: "Länsi",
		sv: "V",
		pt: "O",
		ca: "O"
	},
	windDirectionLabelNW: {
		en: "NW",
		de: "NW",
		nl: "NW",
		da: "NV",
		ro: "NV",
		fr: "NO",
		gr: "BΔ",
		it: "NO",
		es: "NO",
		nb: "NV",
		bg: "СЗ",
		cs: "SZ",
		si: "SZ",
		fi: "Luode",
		sv: "NV",
		pt: "NO",
		ca: "NO"
	},
	windDirectionDescription: {
		en: "The wind direction. Green arrow indicates average wind direction.",
		de: "Die Windrichtung. Der grüne Pfeil zeigt die durchschnittliche Windrichtung an.",
		nl: "De windrichting. De groene pijl geeft de gemiddelde windrichting aan.",
		da: "Vindretning. Grøn pil angiver den gennemsnitlige vindretning.",
		ro: "Direcția vântului. Săgeata verde indică direcția medie a vântului.",
		fr: "La direction du vent. La flêche verte indique la direction moyenne du vent.",
		gr: "Η διεύθυνση του ανέμου. Το πράσινο βέλος δείχνει τη μέση κατεύθυνση του ανέμου.",
		it: "La direzione del vento: la freccia verde indica la direzione media del vento.",
		es: "La dirección del viento. La flecha verde indica la dirección promedio del viento.",
		nb: "Vindretningen. Grønn pil indikerer gjennomsnittlig vindretning.",
		bg: "Посока на вятъра. Зелената стрелка показва средната посока на вятъра.",
		cs: "Směr větru. Zelená šipka ukazuje průměrný směr větru.",
		si: "Smer vetra. Zelena puščica označuje povprečno smer vetra.",
		fi: "Tuulen suunta. Vihreä nuoli osoittaa keskimääräisen tuulen suunnan.",
		sv: "Vindriktning. Grön pil anger genomsnittlig vindrikting.",
		pt: "A direção do vento. A seta verde indica a direção do vento média.",
		ca: "La direcció del vent. La fletxa verda indica la direcció mitjana del vent."
	},
	windSpeedMax: {
		en: "max",
		de: "max",
		nl: "Max",
		da: "max",
		ro: "max",
		fr: "Max",
		gr: "mέγ",
		it: "max",
		es: "máx",
		nb: "max",
		bg: "макс",
		cs: "max",
		si: "max",
		fi: "Max",
		sv: "Max",
		pt: "max",
		ca: "màx"
	},
	windSpeedTitle: {
		en: "Wind Speed",
		de: "Windgeschwindigkeit",
		nl: "Windsnelheid",
		da: "Vindhastighed",
		ro: "Viteza vântului",
		fr: "Vitesse du vent",
		gr: "Ταχύτητα Ανέμου",
		it: "Velocità del vento",
		es: "Velocidad del viento",
		nb: "Vindstyrke",
		bg: "Скорост на вятъра",
		cs: "Rychlost větru",
		si: "Hitrost vetra",
		fi: "Tuulen nopeus",
		sv: "Vindhastighet",
		pt: "Velocidade Vento",
		ca: "Velocitat del vent"
	},
	windSpeedWind: {
		en: "Wind",
		de: "Wind",
		nl: "Wind",
		da: "Vind",
		ro: "Vântul",
		fr: "Vent",
		gr: "Ταχύτητα",
		it: "Vento",
		es: "Viento",
		nb: "Vind",
		bg: "Вятър",
		cs: "Vítr",
		si: "Veter",
		fi: "Tuuli",
		sv: "Vind",
		pt: "Vento",
		ca: "Vent"
	},
	windSpeedGust: {
		en: "Gust",
		de: "Böen",
		nl: "Vlaag",
		da: "Stød",
		ro: "Rafale",
		fr: "Rafale",
		gr: "φύσημα",
		it: "Raffica",
		es: "Ráfaga",
		nb: "Kast",
		bg: "Порив",
		cs: "Poryv",
		si: "Sunek",
		fi: "Puuska",
		sv: "Byighet",
		pt: "Rajada",
		ca: "Cop"
	},
	windSpeedAverage: {
		en: "Average",
		de: "Durchschnitt",
		nl: "Gemiddeld",
		da: "Gennemsnit",
		ro: "Media",
		fr: "Moyenne",
		gr: "Μέση",
		it: "Media",
		es: "Media",
		nb: "Gjennomsnitt",
		bg: "Средна",
		cs: "Průměrná",
		si: "Povprečno",
		fi: "Keskiarvo",
		sv: "Genomsnittlig",
		pt: "Média",
		ca: "Mitjana"
	},
	windSpeedDescription: {
		en: "Green bar indicates average wind speed.\nPurple bar indicates gust speed.",
		de: "Grüner Balken zeigt die durchschnittliche Windgeschwindigkeit an.\nvioletter Balken zeigt die Böengeschwindigkeit an.",
		nl: "Groene balk geeft de gemiddelde windsnelheid aan. \nPaarse balk geeft de windsnelheid in vlagen aan.",
		da: "Grøn bjælke angiver middelvind.\nLilla bjælke angiver vindstød.",
		ro: "Bara verde indică viteza medie a vântului.\nVioleta scurtă indică viteza de rafală.",
		fr: "La barre verte indique la vitesse moyenne du vent.\nLa barre violette indique la vitesse de la rafale du vent.",
		gr: "Η πράσινη ράβδος δείχνει τη μέση ταχύτητα του ανέμου.\nμωβ ράβδος σκουριάς δείχνει την ταχύτητα της ριπής.",
		it: "La barra verde indica la velocità media del vento.\nPurple barra indica la velocità della raffica.",
		es: "La barra verde indica la velocidad promedio del viento.\npúrpura color indica la velocidad de ráfaga.",
		nb: "Grønn: Indikerer gjennomsnittlig vindhastighet.\nLilla: indikerer vindhastighet akuratt nå (vindkast).",
		bg: "Зеленото стълбче показва средната скорост на вятъра.\nЛилавото стълбче показва скоростта на поривите на вятъра.",
		cs: "Zelená čára označuje průměrnou rychlost větru.\nSloupec označuje rychlost poryvu.",
		si: "Zelena vrstica označuje povprečno hitrost vetra. \nVijolična vrstica označuje sunek vetra.",
		fi: "Vihreä palkki ilmaisee keskimääräisen tuulen nopeuden.\nVioletti palkki ilmaisee puuskan nopeuden.",
		sv: "Grön stapel indikerar genomsnittlig vind. \nLila stapel indikerar vindbyar.",
		pt: "A barra verde indica a velocidade do vento média.\nA barra roxa indica a velocidade da rajada.",
		ca: "La barra verda indica la velocitat mitjana del vent.\nporpra indica la velocitat del cop."
	},
	recordsHighTemp: {
		en: "Highest temperature",
		de: "Höchste Temperatur",
		nl: "Hoogste temperatuur",
		da: "Højeste temperatur",
		ro: "Recordul de temperatură mare",
		fr: "Température la plus haute",
		gr: "Υψηλότερη θερμοκρασία",
		it: "Temperatura massima",
		es: "Temperatura más alta",
		nb: "Høyeste temperatur",
		bg: "Най-висока температура",
		cs: "Nejvyšší teplota",
		si: "Najvišja temperatura",
		fi: "Korkein lämpötila",
		sv: "Högsta temperatur",
		pt: "Temperatura mais alta",
		ca: "Temperatura més alta"
	},
	recordsLowTemp: {
		en: "Lowest temperature",
		de: "Niedrigste Temperatur",
		nl: "Laagste temperatuur",
		da: "Laveste temperatur",
		ro: "Recordul de temperatură mică",
		fr: "Température la plus basse",
		gr: "Χαμηλότερη θερμοκρασία",
		it: "Temperatura più bassa",
		es: "Temperatura más baja",
		nb: "Laveste temperatur",
		bg: "Най-ниска температура",
		cs: "Nejnižší teplota",
		si: "Najnižja temperatura",
		fi: "Matalin lämpötila",
		sv: "Lägsta temperatur",
		pt: "Temperatura mais baixa",
		ca: "Temperatura més baixa"
	},
	recordsHighGust: {
		en: "Highest gust",
		de: "höchste Böe",
		nl: "Sterkste vlaag",
		da: "Kraftigste vindstød",
		ro: "Recordul rafalelor",
		fr: "Rafale de vent maximale",
		gr: "Υψηλότερη φύσημα",
		it: "Il più alto gusto",
		es: "Mayor ráfaga",
		nb: "Kraftigste vindkast",
		bg: "Най-силен порив на вятъра",
		cs: "Nejvyšší poryv",
		si: "Najvišji sunek",
		fi: "Korkein puuska",
		sv: "Högsta byighet",
		pt: "Rajada máxima",
		ca: "Cop màxim"
	},
	recordsHighRainRate: {
		en: "Highest rain rate",
		de: "höchste Regenrate",
		nl: "Hoogste hoeveelheid regen",
		da: "Højeste regnrate",
		ro: "Recordul ratei ploii",
		fr: "Taux de précipitations maximal",
		gr: "Υψηλότερη βροχόπτωση",
		it: "Tasso di pioggia più alto",
		es: "Tasa de lluvia más alta",
		nb: "Høyeste endring i nedbør",
		bg: "Максимален валежен интензитет",
		cs: "Největší srážky",
		si: "Jakost padavin",
		fi: "Korkein sademäärä",
		sv: "Största regnmängden",
		pt: "Pluviosidade máxima",
		ca: "Intensitat de pluja més alta"
	},
	recordsLowBaro: {
		en: "Lowest barometer",
		de: "min. Luftdruck",
		nl: "Laagste stand barometer",
		da: "Laveste lufttryk",
		ro: "Recordul presiunii scăzute",
		fr: "Pression la plus basse",
		gr: "Χαμηλότερο βαρόμετρο",
		it: "Barometro più basso",
		es: "Barómetro más bajo",
		nb: "Lavest barometertrykk",
		bg: "Най-ниско налягане",
		cs: "Nejnižší tlak vzduchu",
		si: "Najnižji pritisk",
		fi: "Matalin ilmanpaine",
		sv: "Lägsta lufttryck",
		pt: "Pressão atmosférica mínima",
		ca: "Baròmetre más baix"
	},
	recordsHighBaro: {
		en: "Highest barometer",
		de: "max. Luftdruck",
		nl: "Hoogste stand barometer",
		da: "Højeste lufttryk",
		ro: "Recordul presiunii mari",
		fr: "Pression la plus haute",
		gr: "Υψηλότερο βαρόμετρο",
		it: "Barometro più alto",
		es: "Barómetro más alto",
		nb: "Høyest barometertrykk",
		bg: "Най-високо налягане",
		cs: "Nejvyšší tlak vzduchu",
		si: "Najvišji pritisk",
		fi: "Korkein ilmanpaine",
		sv: "Högsta lufttryck",
		pt: "Pressão atmosférica máxima",
		ca: "Baròmetre més alt"
	},
	recordsHighRainRateDaily: {
		en: "Highest daily rainfall",
		de: "Höchster Tagesniederschlag",
		nl: "Hoogste dagelijkse hoeveelheid regen",
		da: "Højeste daglige regnmængde",
		ro: "Recordul pentru cele mai mari precipitații zilnice",
		fr: "Précipitations maximales en 1 jour",
		gr: "Υψηλότερη ημερήσια βροχόπτωση",
		it: "Pioggia giornaliera massima",
		es: "La mayor cantidad de lluvia diaria",
		nb: "Høyeste daglige nedbør",
		bg: "Максимален дневен валеж",
		cs: "Nejvyšší denní srážky",
		si: "Najvišja dnevna jakost padavin",
		fi: "Korkein päivittäinen sademäärä",
		sv: "Högsta dagliga regnmängd",
		pt: "Pluviosidade máxima diária",
		ca: "Pluja màxima diària"
	},
	recordsHighRainRateHourly: {
		en: "Highest hourly rainfall",
		de: "Höchster stündlicher Niederschlag",
		nl: "Hoogste hoeveelheid regen per uur",
		da: "Højeste regnmængde pr. time",
		ro: "Cea mai mare ploaie orară",
		fr: "Précipitations maximales en 1 heure",
		gr: "Υψηλότερη ωριαία βροχόπτωση",
		it: "Pioggia orario più alta",
		es: "Mayor precipitación por hora",
		nb: "Høyest nedbør pr.timen",
		bg: "Максимален валеж за 1 час",
		cs: "Nejvyšší hodinové srážky",
		si: "Najvišja jakost padavin na uro",
		fi: "Korkein sademäärä tunneittain",
		sv: "Högsta regnmängd per timme",
		pt: "Pluviosidade máxima em 1 hora",
		ca: "Màxima precipitació per hora"
	},
	recordsHighAverageWind: {
		en: "Highest average wind speed",
		de: "Höchste durchschnittliche Windgeschwindigkeit",
		nl: "Hoogste gemiddelde windsnelheid",
		da: "Kraftigste middelvind",
		ro: "Cea mai mare viteză medie a vântului",
		fr: "Vitesse maximale du vent moyen",
		gr: "Μέγιστη μέση ταχύτητα ανέμου",
		it: "Velocità del vento media più alta",
		es: "Velocidad promedia del viento más alta",
		nb: "Kraftigste Gj.snitt vindstyrke",
		bg: "Максимална средна скорост на вятъра",
		cs: "Nejvyšší průměrná rychlost větru",
		si: "Najvišja povprečna hitrost vetra",
		fi: "Suurin keskimääräinen tuulen nopeus",
		sv: "Högsta genomsnittliga vindhastighet",
		pt: "Máxima velocidade do vento média",
		ca: "Velocitat mitjana del vent més alta"
	},
	recordsLowWindChill: {
		en: "Lowest wind chill",
		de: "min.gefühlte Tmperatur",
		nl: "Laagste gevoelstemperatuur",
		da: "Laveste kuldeindeks",
		ro: "Cel mai scăzut vânt tăios",
		fr: "Facteur vent le plus froid",
		gr: "Ο ψυχρότερος άνεμος",
		it: "Vento più freddo",
		es: "Frío del viento más bajo",
		nb: "Laveste følt tempratur",
		bg: "Най-нисък уиндчил",
		cs: "Nejnižší pocitová teplota",
		si: "Najnižji občutek temperature",
		fi: "Alin hyytävyys",
		sv: "Lägsta köldindex",
		pt: "Mínimo índice de frio",
		ca: "Sensació mínima"
	},
	recordsWarmestDay: {
		en: "Warmest day",
		de: "Wärmster Tag",
		nl: "Warmste dag",
		da: "Varmeste dag",
		ro: "Ziua cea mai caldă",
		fr: "Jour le plus chaud",
		gr: "Ζεστή ημέρα",
		it: "Giorno più caldo",
		es: "El día más cálido",
		nb: "Varmest dag (Snitt 6-18)",
		bg: "Най-топъл ден (6-18ч.)",
		cs: "Nejteplejší den",
		si: "Najtoplejši dan",
		fi: "Lämpimin päivä",
		sv: "Varmaste dagen",
		pt: "Dia mais quente",
		ca: "Dia més calurós"
	},
	recordsColdestNight: {
		en: "Coldest night",
		de: "kälteste Nacht",
		nl: "Koudste nacht",
		da: "Koldeste nat",
		ro: "Noaptea cea mai rece",
		fr: "Nuit la plus froide",
		gr: "Η πιο ψυχρή νύχτα",
		it: "Notte più fredda",
		es: "La noche más fría",
		nb: "Kaldest natt (Snitt 18-6)",
		bg: "Най-студена нощ (18-6ч.)",
		cs: "Nejchladnější noc",
		si: "Najtoplejša noč",
		fi: "Kylmin yö",
		sv: "Kallaste natten",
		pt: "Noite mais fria",
		ca: "Nit més freda"
	},
	recordsColdestDay: {
		en: "Coldest day",
		de: "kältester Tag",
		nl: "Koudste dag",
		da: "Koldeste dag",
		ro: "Ziua cea mai rece",
		fr: "Jour le plus froid",
		gr: "Η πιό ψυχρή ημέρα",
		it: "Giorno più freddo",
		es: "Día más frío",
		nb: "Kaldest dag (Snitt 6-18)",
		bg: "Най-студен ден (6-18ч.)",
		cs: "Nejchladnější den",
		si: "Najbolj mrzel dan",
		fi: "Kylmin päivä",
		sv: "Kallaste dagen",
		pt: "Dia mais frio",
		ca: "Dia més fred"
	},
	recordsWarmestNight: {
		en: "Warmest night",
		de: "wärmste Nacht",
		nl: "Warmste nacht",
		da: "Varmeste nat",
		ro: "Cea mai caldă noapte",
		fr: "Nuit la plus chaude",
		gr: "Ζεστή νύχτα",
		it: "Notte più calda",
		es: "La noche más cálida",
		nb: "Varmest natt (Snitt 18-6)",
		bg: "Най-топла нощ (18-6ч.)",
		cs: "Nejteplejší noc",
		si: "Najtoplejša noč",
		fi: "Lämpimin yö",
		sv: "Varmaste natten",
		pt: "Noite mais quente",
		ca: "Nit més calurosa"
	},
	recordsHighHeatIndex: {
		en: "Highest heat index",
		de: "höchster Hitzeindex",
		nl: "Hoogste warmte index",
		da: "Højeste varmeindeks",
		ro: "Recordul indicelui de căldură",
		fr: "Indice de chaleur maximal",
		gr: "Υψηλότερος δείκτης θερμότητας",
		it: "Indice di calore più alto",
		es: "Índice de calor más alto",
		nb: "Høyeste følt varme",
		bg: "Най-висок топлинен индекс",
		cs: "Nejvyšší teplotní index",
		si: "Najvišji toplotni indeks",
		fi: "Suurin lämpöindeksi",
		sv: "Högsta värmeindex",
		pt: "Máximo índice de calor",
		ca: "Xafogor màxima"
	},
	recordsHighSolar: {
		en: "Highest solar",
		de: "max.Solar",
		nl: "Hoogste zonkracht",
		da: "Højeste solindstråling",
		ro: "Cel mai înalt nivel solar",
		fr: "Solaire maximal",
		gr: "Υψηλότερο ηλιακό",
		it: "Il più alto solare",
		es: "Más alto solar",
		nb: "Høyeste solenergi",
		bg: "Най-висок соларен интензитет",
		cs: "Nejvyšší sluneční svit",
		si: "Najvišje izžarevanje sonca",
		fi: "Voimakkain auringon säteily",
		sv: "Högsta solinstrålningen",
		pt: "Máximo radiação solar",
		ca: "Radiació solar màxima"
	},
	recordsHighUV: {
		en: "Highest uv index",
		de: "max.UV Index",
		nl: "Hoogste uv index",
		da: "Højeste uv indeks",
		ro: "Cel mai înalt nivel UV",
		fr: "Indice UV maximal",
		gr: "Υψηλότερο ευρετήριο UV",
		it: "Indice UV più alto",
		es: "Índice UV más alto",
		nb: "Høyeste UV-indeks",
		bg: "Най-висок UV индекс",
		cs: "Nejvyšší index UV",
		si: " Najvišji UV",
		fi: "Korkein UV-indeksi",
		sv: "Högsta UV-index",
		pt: "Máximo índice UV",
		ca: "Index UV màxim"
	},
	recordsHighDewPoint: {
		en: "Highest dew point",
		de: "max.Taupunkt",
		nl: "Hoogste dauwpunt",
		da: "Højeste dugpunkt",
		ro: "Record de punct de rouă ridicat",
		fr: "Point de rosée maximal",
		gr: "Υψηλότερο σημείο δρόσου",
		it: "Punto di rugiada più alto",
		es: "Punto de rocío más alto",
		nb: "Høyeste duggpunkt",
		bg: "Най-висока точка на оросяване",
		cs: "Nejvyšší rosný bod",
		si: "Najvišja točka rosišča",
		fi: "Korkein kastepiste",
		sv: "Högsta daggpunkten",
		pt: "Ponto de Orvalho máximo",
		ca: "Punt de rosada màxim"
	},
	recordsLowDewPoint: {
		en: "Lowest dew point",
		de: "min.Taupunkt",
		nl: "Laagste dauwpunt",
		da: "Laveste dugpunkt",
		ro: "Record de punct rouă scazut",
		fr: "Point de rosée minimal",
		gr: "Χαμηλότερο σημείο δρόσου",
		it: "Punto di rugiada più basso",
		es: "Punto de rocío más bajo",
		nb: "Laveste duggpunkt",
		bg: "Най-ниска точка на оросяване",
		cs: "Nejnižší rosný bod",
		si: "Najnižja točka rosišča",
		fi: "Matalin kastepiste",
		sv: "Lägsta daggpunkten",
		pt: "Ponto de orvalho mínimo",
		ca: "Punt de rosada màxim"
	},
	forcastShowMore: {
		en: "Show More",
		de: "zeige mehr",
		nl: "Toon meer",
		da: "Vis mere",
		ro: "Afișați mai multe",
		fr: "Montrer plus",
		gr: "Δείτε περισσότερα",
		it: "Mostra di più",
		es: "Mostrar más",
		nb: "Vis mer",
		bg: "Покажи повече",
		cs: "Zobrazit více",
		si: "Pokaži več",
		fi: "Näytä lisää",
		sv: "Visa mer",
		pt: "Ver mais",
		ca: "Mostrar-ne més"
	},
	graphMax: {
		en: "Max",
		de: "Max",
		nl: "Max",
		da: "Max",
		ro: "Max",
		fr: "Max",
		gr: "Μέγ",
		it: "Max",
		es: "Máx",
		nb: "Max",
		bg: "Макс",
		cs: "Max",
		si: "Max",
		fi: "Max",
		sv: "Max",
		pt: "Max",
		ca: "Màx"
	},
	graphMin: {
		en: "Min",
		de: "Min",
		nl: "Min",
		da: "Min",
		ro: "Min",
		fr: "Min",
		gr: "Ελά",
		it: "Min",
		es: "Mín",
		nb: "Mín",
		bg: "Мин",
		cs: "Min",
		si: "Min",
		fi: "Min",
		sv: "Min",
		pt: "Min",
		ca: "Mín"
	},
	graphLast: {
		//NOTE: these are used as in: Last XX days, or Last XX Hours, etc.en: "Last",
		en: "Last",
		de: "Letzte",
		nl: "Laatste",
		da: "Sidste",
		ro: "Ultimele",
		fr: "Dernier",
		gr: "τελευταίος",
		it: "Ultimo",
		es: "Últimas",
		nb: "Siste",
		bg: "Посл.",
		cs: "Poslední",
		si: "Zadnjih",
		fi: "viimeisimmät",
		sv: "Sista",
		pt: "Últimos(as)",
		ca: "Últimes"
	},
	graphDays: {
		en: "Days",
		de: "Tage",
		nl: "Dagen",
		da: "Dage",
		ro: "Zile",
		fr: "Jours",
		gr: "Ημέρες",
		it: "Giorni",
		es: "Dias",
		nb: "Dager",
		bg: "Дни",
		cs: "Dny",
		si: "Dni",
		fi: "päivää",
		sv: "Dagarna",
		pt: "Dias",
		ca: "Dies"
	},
	graphHours: {
		en: "Hours",
		de: "Stunden",
		nl: "Uur",
		da: "Timer",
		ro: "Ore",
		fr: "Heures",
		gr: "Ωρες",
		it: "Ore",
		es: "Horas",
		nb: "Timer",
		bg: "Часа",
		cs: "Hodiny",
		si: "Ure",
		fi: "tuntia",
		sv: "Timmarna",
		pt: "Horas",
		ca: "Hores"
	},
	graphHour: {
		en: "Hour",
		de: "Stunde",
		nl: "Uur",
		da: "Time",
		ro: "Ora",
		fr: "Heure",
		gr: "Ωρα",
		it: "Ora",
		es: "Hora",
		nb: "Time",
		bg: "Час",
		cs: "Hodina",
		si: "Ura",
		fi: "60 minuuttia",
		sv: "Timme",
		pt: "Hora",
		ca: "Hora"
	},
	graphMonths: {
		en: "Months",
		de: "Monate",
		nl: "Maanden",
		da: "Måned",
		ro: "Luna",
		fr: "Mois",
		gr: "Μήνες",
		it: "Mesi",
		es: "Meses",
		nb: "Måned",
		bg: "Месеца",
		cs: "Měsíce",
		si: "Mesecev",
		fi: "Kuukautta",
		sv: "Månader",
		pt: "Meses",
		ca: "Mesos"
	},
	graphBaroLabel: {
		en: "Pressure",
		de: "Luftdruck",
		nl: "Luchtdruk",
		da: "Lufttryk",
		ro: "Presiunea",
		fr: "Pression",
		gr: "Πίεση",
		it: "Pressione",
		es: "Presión",
		nb: "Lufttrykk",
		bg: "Налягане",
		cs: "Tlak",
		si: "Pritisk",
		fi: "Paine",
		sv: "Lufttryck",
		pt: "Pressão",
		ca: "Pressió"
	},
	graphHumidityLabel: {
		en: "Percent",
		de: "Prozent",
		nl: "Procent",
		da: "Procent",
		ro: "Procentul",
		fr: "Pour cent",
		gr: "Τοις εκατό",
		it: "Percentuale",
		es: "Porcentaje",
		nb: "Prosent",
		bg: "Процент",
		cs: "Procent",
		si: "Procent",
		fi: "Prosentti",
		sv: "Procent",
		pt: "Percentagem",
		ca: "Percentatge"
	},
	graphSolarLabel: {
		en: "Irradiance",
		de: "Solarstrahlung",
		nl: "Instraling",
		da: "Indstråling",
		ro: "Radiația",
		fr: "Irradiation",
		gr: "Ακτινοβολία",
		it: "Irradiazione",
		es: "Radiación",
		nb: "",
		bg: "Интензитет",
		cs: "Záření",
		si: "Obsevanje",
		fi: "Säteilyvoimakkuus",
		sv: "Solstrålning",
		pt: "Irradiância",
		ca: "Radiació"
	},
	graphLabelUV: {
		en: "Index",
		de: "Index",
		nl: "Index",
		da: "Indeks",
		ro: "Index",
		fr: "Index",
		gr: "Δείκτης",
		it: "Indice",
		es: "Índice",
		nb: "Index",
		bg: "Индекс",
		cs: "Index",
		si: "Indeks",
		fi: "Indeksi",
		sv: "Index",
		pt: "Índice",
		ca: "Index"
	},
	graphLabelWindDirection: {
		en: "Wind Direction",
		de: "Windrichtung",
		nl: "Windrichting",
		da: "Vindretning",
		ro: "Direcția vântului",
		fr: "Direction du vent",
		gr: "Κατεύθυνση ανέμου",
		it: "La direzione del vento",
		es: "Dirección del viento",
		nb: "Vindretning",
		bg: "Посока на вятъра",
		cs: "Směr větru",
		si: "Smer vetra",
		fi: "Tuulen suunta",
		sv: "Vindriktning",
		pt: "Direção do vento",
		ca: "Direcció del vent"
	},
	buttonLabelGraphs: {
		en: "Graphs",
		de: "Grafik",
		nl: "Grafieken",
		da: "Grafer",
		ro: "Grafice",
		fr: "Graphiques",
		gr: "διάγραμμα",
		it: "Grafici",
		es: "Gráficos",
		nb: "Grafer",
		bg: "Графики",
		cs: "Grafy",
		si: "Graf",
		fi: "Käyrät",
		sv: "Grafer",
		pt: "Gráficos",
		ca: "Gràfics"
	},
	buttonLabelRecords: {
		en: "Records",
		de: "Rekorde",
		nl: "Records",
		da: "Rekorder",
		ro: "Recorduri",
		fr: "Records",
		gr: "Εγγραφές",
		it: "Records",
		es: "Récords",
		nb: "Rekorder",
		bg: "Pекорди",
		cs: "Rekordy",
		si: "Rekordi",
		fi: "Arkisto",
		sv: "Rekord",
		pt: "Registos",
		ca: "Rècords"
	},
	buttonLabelAltitude: {
		en: "Altitude",
		de: "Höhe",
		nl: "Hoogte",
		da: "Højde",
		ro: "Altitudinea",
		fr: "Altitude",
		gr: "Υψόμετρο",
		it: "Altitudine",
		es: "Altitud",
		nb: "Høyde",
		bg: "Bисочина",
		cs: "Nadmořská výška",
		si: "Nadmorska višina",
		fi: "Korkeus",
		sv: "Höjd",
		pt: "Altitude",
		ca: "Altitud"
	},
	recordsForMonth: {
		en: "Records for this month",
		de: "Monatsrekorde",
		nl: "Records voor deze maand",
		da: "Rekorder for denne måned",
		ro: "Recordul pentru aceasta lună",
		fr: "Records de ce mois",
		gr: "Εγγραφές για αυτόν τον μήνα",
		it: "Record per questo mese",
		es: "Registros para este mes",
		nb: "Rekorder denne måneden",
		bg: "Рекорди за този месец",
		cs: "Záznamy za tento měsíc",
		si: "Rekordi za ta mesec",
		fi: "Tallenteet tässä kuussa",
		sv: "Rekordet denna månad",
		pt: "Registos deste mês",
		ca: "Registres d'aquest mes"
	},
	recordsForYear: {
		en: "Records for this year",
		de: "Rekorde dieses Jahr",
		nl: "Records voor dit jaar",
		da: "Rekorder for dette år",
		ro: "Recordul pentru acest an",
		fr: "Records de cette année",
		gr: "Εγγραφές για το τρέχον έτος",
		it: "Record per quest'anno",
		es: "Registros para este año",
		nb: "Rekorder i år",
		bg: "Рекорди за тази година",
		cs: "Záznamy za tento rok",
		si: "Rekordi za to leto",
		fi: "Tallenteet tälle vuodelle",
		sv: " Rekordet för detta år",
		pt: "Registos deste ano",
		ca: "Registres d'aquest any"
	},
	recordsAllTime: {
		en: "All time records",
		de: "Allzeitrekorde",
		nl: "Records aller tijden",
		da: "Rekorder siden start",
		ro: "Recordul pentru toți anii",
		fr: "Records absolus",
		gr: "Όλες οι εγγραφές χρόνου",
		it: "Record di tutti i tempi",
		es: "Registros de todos los tiempos",
		nb: "Rekorder totalt",
		bg: "Рекорди за всичките години",
		cs: "Veškeré záznamy",
		si: "Rekordi (all time)",
		fi: "Kaikki tallenteet",
		sv: "Högsta rekordet någonsin",
		pt: "Registos históricos",
		ca: "Registres de tots els temps"
	},
	forecastTitle: {
		en: "Forecast",
		de: "Vorhersage",
		nl: "Voorspelling",
		da: "Vejrudsigt",
		ro: "Prognoza",
		fr: "Prévisions",
		gr: "Πρόβλεψη",
		it: "Prevedere",
		es: "Pronóstico",
		nb: "Værvarsel",
		bg: "Прогноза",
		cs: "Předpověď",
		si: "Napoved",
		fi: "Ennuste",
		sv: "Prognos",
		pt: "Previsão",
		ca: "Predicció"
	},
	heatIndexTitle: {
		en: "Heat Index",
		de: "Hitzeindex",
		nl: "Hitte Index",
		da: "Varmeindeks",
		ro: "Indicele de caldură",
		fr: "Indice de chaleur",
		gr: "Δείκτης θερμότητας",
		it: "Indice di calore",
		es: "Índice de calor",
		nb: "Følt varme",
		bg: "Топл. индекс",
		cs: "Teplotní index",
		si: "Toplotni indeks",
		fi: "Lämpöindeksi",
		sv: "Värmeindex",
		pt: "Índice de calor",
		ca: "Xafogor"
	},
	heatIndexDescription: {
		en: "How hot it really feels when relative humidity is factored with the actual air temperature.",
		de: "Wie es sich wirklich anfühlt, wenn die relative Luftfeuchtigkeit in Relation zur aktuellen Luftfeuchtigkeit steht.",
		nl: "De warmte-index is een getal dat aangeeft hoe een mens gemiddeld een temperatuur in combinatie met een bepaalde vochtigheidsgraad beleeft, hoe hij of zij dit aanvoelt.",
		da: "Hvor varmt det føles når luftfugtigheden kombineres med luftens temperatur.",
		ro: "Cât de cald se simte cu adevărat atunci când umiditatea relativă este luată în considerare cu temperatura reală a aerului.",
		fr: "Il fait vraiment très chaud lorsque l’humidité relative est prise en compte dans la température réelle de l’air.",
		gr: "Πόσο ζεστό αισθάνεται πραγματικά όταν η σχετική υγρασία υπολογίζεται με την πραγματική θερμοκρασία του αέρα.",
		it: "Quanto fa veramente caldo quando l'umidità relativa viene calcolata con la temperatura dell'aria effettiva.",
		es: "Qué calor realmente se siente cuando la humedad relativa se tiene en cuenta con la temperatura real del aire.",
		nb: "Hvor varmt det virkelig føles når den relative luftfuktigheten er tatt med i selve lufttemperaturen..",
		bg: "Топлинен индекс: Колко горещо се усеща в действителност, при текущата комбинация на относителна влажност и температура на въздуха.",
		cs: "Jakou teplotu pociťujeme, když je skutečná teplota zohledněna relativní vlhkostí vzduchu.",
		si: "Občutek vročine, ko je relativna vlažnost upoštevana z dejansko temperaturo zraka.",
		fi: "Kuinka kuumalta ilma tuntuu, kun suhteellinen kosteus otetaan huomioon todellisen ilman lämpötilan suhteen.",
		sv: "Hur varmt det känns när relativa fuktigheten kombineras med aktuell temperatur.",
		pt: "Temperatura percetível. Calculado combinando a temperatura e humidade relativa.",
		ca: "El calor que realment se sent quan la humitat relativa es relaciona amb la temperatura de l'aire."
	},
	beaufortScaleTitle: {
		en: "Beaufort Scale",
		de: "Beaufort Skala",
		nb: "Beaufort Skala",
		si: "Boforjeva lestvica",
		sv: "Beaufort skalan",
		pt: "Escala de Beaufort",
		ca: "Escala de Beaufort",
		cs: "Beaufortova stupnice síly větru",
		bg: "Скала на Бофорт",
		fi: "Boforiasteikko"
	}
};

//Fetch string from dictionary
function useDict(wordIn) {
    //If the word doesn't exist (incorrect wordIn), return an error
    if(typeof dict[wordIn] === "undefined") {
        console.error("WORD NOT FOUND IN DICTIONARY");
        return " ";
    }
    
    //If the word doesn't exist in dictionary file for a given langauge, return it in the default langauge (English)
    if(typeof dict[wordIn][lang] === "undefined") {
        console.log("WORD NOT FOUND IN LANGUAGE. DEFAULTING TO ENGLISH:\n" + wordIn);
        return dict[wordIn]["en"];
    }
    return dict[wordIn][lang];
}

//Sets GLOBAL variables
//Customizables
var globalFontFamily = "Arial", //The font used throughout the page
    colour = {
        barometer: "40, 104, 206",
        rainfall: "0, 71, 183",
        wind: "23, 145, 27",
        windGust: "188, 0, 255",
        humidity: "16, 217, 244",
        solar: "245, 193, 18",
        temp: "209, 32, 32",
        tempLow: "0, 50, 200",
        uv: "234, 242, 45"
    },
    graphStyles = { //The Styles for each graph
        barometer: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.barometer + ", 0.4)",
            borderColor: "rgba(" + colour.barometer + ", 0.8)",
            pointBorderColor: "rgba(" + colour.barometer + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.barometer + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.barometer + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.barometer + ", 0.6)"
        },
        rainfallLine: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.rainfall + ", 0.4)",
            borderColor: "rgba(" + colour.rainfall + ", 0.8)",
            pointBorderColor: "rgba(" + colour.rainfall + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.rainfall + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.rainfall + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.rainfall + ", 0.6)"
        },
        rainfallBar: {
            label: null,
            data: null,
            backgroundColor: "rgba(" + colour.rainfall + ", 0.4)",
            borderColor: "rgba(" + colour.rainfall + ", 0.8)",
            borderWidth: 2
        },
        wind: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.wind + ", 0.4)",
            borderColor: "rgba(" + colour.wind + ", 0.8)",
            pointBorderColor: "rgba(" + colour.wind + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.wind + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.wind + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.wind + ", 0.6)"
        },
        windGust: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.windGust + ", 0.4)",
            borderColor: "rgba(" + colour.windGust + ", 0.8)",
            pointBorderColor: "rgba(" + colour.windGust + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.windGust + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.windGust + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.windGust + ", 0.6)"
        },
        humidity: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.humidity + ", 0.4)",
            borderColor: "rgba(" + colour.humidity + ", 0.8)",
            pointBorderColor: "rgba(" + colour.humidity + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.humidity + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.humidity + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.humidity + ", 0.6)"
        },
        solar: {
            label: null,
            data: {x: 0, y: null},
            fill: true,
            backgroundColor: "rgba(" + colour.solar + ", 0.4)",
            borderColor: "rgba(" + colour.solar + ", 0.8)",
            pointBorderColor: "rgba(" + colour.solar + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.solar + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.solar + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.solar + ", 0.6)"
        },
        tempHigh: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.temp + ", 0.4)",
            borderColor: "rgba(" + colour.temp + ", 0.8)",
            pointBorderColor: "rgba(" + colour.temp + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.temp + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.temp + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.temp + ", 0.6)"
        },
        tempLow: {
            label: null,
            data: {x: 0, y: null},
            fill: false,
            backgroundColor: "rgba(" + colour.tempLow + ", 0.4)",
            borderColor: "rgba(" + colour.tempLow + ", 0.8)",
            pointBorderColor: "rgba(" + colour.tempLow + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.tempLow + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.tempLow + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.tempLow + ", 0.6)"
        },
        uv: {
            label: null,
            data: {x: 0, y: null},
            fill: true,
            backgroundColor: "rgba(" + colour.uv + ", 0.4)",
            borderColor: "rgba(" + colour.uv + ", 0.8)",
            pointBorderColor: "rgba(" + colour.uv + ", 0.6)",
            pointBackgroundColor: "rgba(" + colour.uv + ", 0.6)",
            pointHoverBackgroundColor: "rgba(" + colour.uv + ", 0.6)",
            pointHoverBorderColor: "rgba(" + colour.uv + ", 0.6)"
        }
    },
    graphDict = {};

//All graphs (to be included in drop down modal menu) and their properties
var globalGraphs = {
    barometer: {
        label: useDict("graphBaroLabel"),
        unit: "pressure",
        style: "barometer",
        graphType: "line",
        tickOptions: {
            beginAtZero: false
        },
        graphs: {
            dailyMonth: {
                title: useDict("barometerTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["baroDays31"],
                timeDisplay: "day",
                legendOptions: {}
            },
            hourlyDay: {
                title: useDict("barometerTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["baroHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("barometerTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["baroQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("barometerTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["baroMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    humidity: {
        label: useDict("graphHumidityLabel"),
        unit: "humidity",
        style: "humidity",
        graphType: "line",
        tickOptions: {
            beginAtZero: true,
            min: 0,
            max: 100
        },
        graphs: {
            dailyMonth: {
                title: useDict("humidityTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["humidityDays31"],
                timeDisplay: "day",
                legendOptions: {}
            },
            hourlyDay: {
                title: useDict("humidityTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["humidityHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("humidityTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["humidityQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("humidityTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["humidityMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    solar: {
        label: useDict("graphSolarLabel"),
        unit: "solar",
        style: "solar",
        graphType: "line",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            hourlyDay: {
                title: useDict("solarTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["solarHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("solarTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["solarQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("solarTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["solarMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    temp: {
        label: useDict("temperatureTitle"),
        unit: "temp",
        style: "tempHigh",
        graphType: "line",
        tickOptions: {
            beginAtZero: false
        },
        graphs: {
            dailyMonth: {
                title: useDict("temperatureTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["tempHighDays31", "tempLowDays31"],
                timeDisplay: "day",
                additionalStyles: ["tempLow"],
                legendLabels: [useDict("graphMax"), useDict("graphMin")],
                legendOptions: {
                    display: true
                }
            },
            hourlyDay: {
                title: useDict("temperatureTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["tempHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("temperatureTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["tempQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("temperatureTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["tempMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    uv: {
        label: useDict("graphLabelUV"),
        unit: "uv",
        style: "uv",
        graphType: "line",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            hourlyDay: {
                title: useDict("uvTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["uvHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("uvTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["uvQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            }
        }
    },
    windDir: {
        label: useDict("graphLabelWindDirection"),
        unit: "windDirection",
        style: "wind",
        graphType: "line",
        tickOptions: {
            beginAtZero: true,
            min: 0,
            max: 360,
            stepSize: 90
        },
        graphs: {
            dailyMonth: {
                title: useDict("graphLabelWindDirection") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["windDirDays31"],
                timeDisplay: "day",
                legendOptions: {}
                
            },
            hourlyDay: {
                title: useDict("graphLabelWindDirection") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["windDirHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("graphLabelWindDirection") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["windDirQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("graphLabelWindDirection") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["windDirMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    windSpeed: {
        label: useDict("windSpeedTitle"),
        unit: "wind",
        style: "wind",
        graphType: "line",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            dailyMonth: {
                title: useDict("windSpeedTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: ["windSpeedDays31"],
                timeDisplay: "day",
                legendOptions: {}
            },
            hourlyDay: {
                title: useDict("windSpeedTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["windSpeedHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("windSpeedTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampQuarterDay",
                data: ["windSpeedQuarterDays28"],
                timeDisplay: "day",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("windSpeedTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["windSpeedMinutes60", "windGustMinutes60"],
                timeDisplay: "minute",
                additionalStyles: ["windGust"],
                legendLabels: [useDict("windSpeedAverage"), useDict("windSpeedGust")],
                legendOptions: {
                    display: true
                }
            }
        }
    },
    rainfallLine: {
        label: useDict("rainfallTitle"),
        unit: "rainfall",
        style: "rainfallLine",
        graphType: "line",
        tickOptions: {
            beginAtZero: false
        },
        graphs: {
            hourlyDay: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + "24" + " " + useDict("graphHours"),
                timestamp: "timestampHour",
                data: ["rainHours24"],
                timeDisplay: "hour",
                legendOptions: {}
            },
            minutlyHour: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + useDict("graphHour"),
                timestamp: "timestampMinute",
                data: ["rainMinutes60"],
                timeDisplay: "minute",
                legendOptions: {}
            }
        }
    },
    rainfallBar: {
        label: useDict("rainfallTitle"),
        unit: "rainfall",
        style: "rainfallBar",
        graphType: "bar",
        tickOptions: {
            beginAtZero: true
        },
        graphs: {
            dailyMonth: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + "31" +  " " + useDict("graphDays"),
                timestamp: "timestampDay",
                data: "rainDays31",
                timeDisplay: "MMM D",
                legendOptions: {}
            },
            monthlyYear: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + "12" +  " " + useDict("graphMonths"),
                timestamp: "timestampMonth",
                data: "rainMonths12",
                timeDisplay: "MMM YYYY",
                legendOptions: {}
            },
            quarterDailyWeek: {
                title: useDict("rainfallTitle") + " " + useDict("graphLast") + " " + "7" + " " + useDict("graphDays"),
                timestamp: "timestampWeekDay",
                data: "rainDays7",
                timeDisplay: "ddd",
                legendOptions: {}
            }
        }
    }
};

//Widget Config / Settings
var widgetList = {
    apparent: {enabled: true},
    temperature: {enabled: true, title: "default", highLowEnabled: true},
    temperature02: {enabled: false, title: "default", highLowEnabled: true, input: 1}, //input: extra sensor 1
    temperature03: {enabled: false, title: "default", highLowEnabled: true, input: 2}, //input: extra sensor 1
    barometer: {enabled: true},
    windChill: {enabled: true, mode: "windchill", autoSwitch: true},
    forecastHandler: {enabled: true},
    graphHandler: {enabled: true},
    graphHandlerBarometer: {enabled: true},
    graphHandlerRainfall: {enabled: true},
    graphHandlerTemperature: {enabled: true},
    graphHandlerWindSpeed: {enabled: true},
    humidity: {enabled: true},
    modalHandler: {enabled: true},
    moonSun: {enabled: true},
    recordHandler: {enabled: true},
    solar: {enabled: true, mode: "percentage"},
    status: {enabled: true},
    rainfallTitle: {enabled: true},
    rainfallDay: {enabled: true},
    rainfallMonth: {enabled: true},
    rainfallYear: {enabled: true},
    UV: {enabled: true},
    windDirection: {enabled: true},
    windSpeed: {enabled: true, gustMode: "current"}
},
    graphList = {
    barometer: {enabled: true},
    humidity: {enabled: true},
    solar: {enabled: true},
    temp: {enabled: true},
    uv: {enabled: true},
    windDir: {enabled: true},
    windSpeed: {enabled: true},
    rainfall: {enabled: true}
}  

//Alter widgetList settings to match any changes made in the config file
if (typeof gaugeSettings !== "undefined") {//Check to see if gauge setting list exists.
    gaugeSettingsWidgets = Object.keys(gaugeSettings);
    for (i = 0; i < gaugeSettingsWidgets.length; i++) {
        if (typeof widgetList[gaugeSettingsWidgets[i]] !== "undefined") {
            var gaugeWidgetKeys = Object.keys(gaugeSettings[gaugeSettingsWidgets[i]]);
            for (p = 0; p < gaugeWidgetKeys.length; p++) {
                widgetList[gaugeSettingsWidgets[i].toString()][gaugeWidgetKeys[p]] = gaugeSettings[gaugeSettingsWidgets[i].toString()][gaugeWidgetKeys[p]];
            }
        }
    }
}

if (typeof graphSettings !== "undefined") {//Check to see if graph setting list exists.
    graphSettingsWidgets = Object.keys(graphSettings);
    for (i = 0; i < graphSettingsWidgets.length; i++) {
        if (typeof graphList[graphSettingsWidgets[i]] !== "undefined") {
            var graphWidgetKeys = Object.keys(graphSettings[graphSettingsWidgets[i]]);
            for (p = 0; p < graphWidgetKeys.length; p++) {
                graphList[graphSettingsWidgets[i].toString()][graphWidgetKeys[p]] = graphSettings[graphSettingsWidgets[i].toString()][graphWidgetKeys[p]];
            }
        }
    }
}

//Functions globally used
//IE compadibility fix
(function () {
    if ( typeof window.CustomEvent === "function" ) return false; //If not IE

    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();

function setFontMaxWidth(textIn, canvasIn, stageIn, doesReposition) {
    //Use with centered text only
    //Stretches/compresses text so that it does not get cut off by edge of canvas
    doesReposition = doesReposition || false;
    var maxTextWidth = Math.min(canvasIn.width - stageIn.x - textIn.x, textIn.x + stageIn.x);
    textIn.maxWidth = maxTextWidth * 2 * 0.95; //Reduced by 5%
    
    //check if should be repositioned, AND if valid to be (A.K.A if textWidth without a maxWidth is different when there is a max width.)
    if (doesReposition && textIn.getMeasuredWidth() > textIn.maxWidth) {
        textIn.x = canvasIn.width/2 - stageIn.x; // move to center, if true
        maxTextWidth = Math.min(canvasIn.width - stageIn.x - textIn.x, textIn.x + stageIn.x);
        textIn.maxWidth = maxTextWidth * 2 * 0.95; //Reduced by 5%
    }
}

function setFontMaxWidthLeft(textIn, canvasIn, stageIn) {
    //Use with left aligned text only
    //Stretches/compresses text so that it does not get cut off by edge of canvas
    var maxTextWidth = Math.min(canvasIn.width - stageIn.x - textIn.x);
    textIn.maxWidth = maxTextWidth * 0.95; //Reduced by 5%
}

function setMaxWidthGivenWidth(textIn, widthIn) {
    textIn.maxWidth = widthIn * 0.97; 
}

//Responsivly resize container to window
function resizeContainer() {
    var container = document.getElementById('FWDLcontainer'),
        ratio = 0.5625, //9:16 ratio
        size = 1.7,
        width = 0,
        height = 0,
        styleString = null;

	//Adjusts div to match resized window. Always adjust to the smallest dimention
	if ((document.documentElement.clientHeight / ratio) <= document.documentElement.clientWidth) {
		width = document.documentElement.clientHeight * size;
		height = document.documentElement.clientHeight * size * ratio;
	} else {
		width = document.documentElement.clientWidth * ratio * size;
		height = document.documentElement.clientWidth * ratio * size * ratio;
	}
    
    width = width.toString() + "px";
    height = height.toString() + "px";
    stlyeString = "width:" + width.toString() + ";height:" + height.toString();
    
    container.setAttribute("style", stlyeString.toString());
    //For browser compadibility
    container.style.width = width.toString();
    container.style.height = height.toString();
}

//Check if browsing on mobile
var onMobile = false;
(function (a) {if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) onMobile = true })(navigator.userAgent || navigator.vendor || window.opera);

//Initialise the layout container settings
function initialiseLayout() {
    //If on desktop, dynamically resize the canvas, but don't on mobile. This is because mobile users need to be able to zoom in and move around if they wish, and dynamic rezising does not allow this.
	if (onMobile === false) {
		window.addEventListener('resize', function () {
			resizeContainer();
		}, false);
	} else {
        //only resize when rotated on mobile
        var mql = window.matchMedia("(orientation: portrait)");
        mql.addListener(function(m) {
            resizeContainer();
        });
    }
	
    //Set the canvas size intially.
	resizeContainer();
    
    //Set version number:
    document.getElementById("Version").innerHTML = "FreshWDL - Version: 1.1.8.9 Alpha.";
}

//Set global Graph options
Chart.defaults.global.elements.line.tension = .1;
Chart.defaults.global.elements.line.borderWidth = 4;
Chart.defaults.global.elements.line.borderCapStyle = "round";
Chart.defaults.global.elements.point.radius = 2;
Chart.defaults.global.elements.point.hitRadius = 10;
Chart.defaults.global.elements.point.pointBorder = 10;
Chart.defaults.global.elements.point.hoverRadius = 5;
Chart.defaults.global.animation.duration = 0;
Chart.defaults.global.responsive = false;
Chart.defaults.global.maintainAspectRatio = false;
Chart.defaults.global.legend.display = false;
Chart.defaults.global.defaultFontFamily = globalFontFamily;

//Set units. In the format of: ["multiplier, "Display", number of decimal places to round to]
var units = {
        pressure: {
            hPa: [1, "hPa", 1],
            mmHG: [0.750061561303, "mmHG", 1],
            kPa: [0.1, "kPa", 2],
            inHg: [0.0295299830714, "inHg", 2],
            mb: [1, "mb", 1]
        },
        altitude: {
            m: [0.3048, "m", 0],
            yds: [0.333333, "yds", 0],
            ft: [1, "ft", 0]
        },
        wind: {
            kmh: [1.852, "km/h", 1],
            mph: [1.15078, "mph", 1],
            kts: [1, "kts", 1],
            ms: [0.514444, "m/s", 1],
            B: [1, "BFT", 1]
        },
        windDirection: {
            deg: [1, "\xB0", 0]
        },
        rainfall: {
            mm: [1, "mm", 1],
            inch: [0.0393701, "in", 2]
        },
        humidity: {
            percent: [1, "%", 0]
        },
        solar: {
            Wm: [1, "W/m\xB2", 1]
        },
        uv: {
            noUnit: [1, " ", 1]
        },
        temp: {
            celsius: [1, String.fromCharCode(176) + "C", 1],
            fahrenheit: [1, String.fromCharCode(176) + "F", 1]
        }
    };

//Globally used helper funtions
function calculateBeaufort(v) {
    //v must be in knots
    return Math.min(Math.round(Math.pow((v*0.514444/0.836), (2/3))), 12);
}

function betterRound(value, decimals) {
    //Better number rounding, credit to: http://www.jacklmoore.com/notes/rounding-in-javascript/
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function formatDataToUnit(dataIn, unitsIn) {
    //Format to the correct unit
    var roundTo = units[unitsIn.toString()][currentUnits[unitsIn.toString()]][2];
    
    if (unitsIn.toString() == "temp") { //Manage C/F non standard conversion
        if (currentUnits[unitsIn.toString()] == "fahrenheit") {
            var fahTemp = dataIn * (9 / 5) + 32;
            return betterRound(fahTemp, roundTo);
        } else {
            return dataIn;
        }
    } else if (currentUnits[unitsIn.toString()] == "B") { //Manage Beaufort non linear conversion
        return calculateBeaufort(dataIn);
    } else if (parseFloat(dataIn) == 0) {
        return betterRound((dataIn * units[unitsIn.toString()][currentUnits[unitsIn.toString()]][0].toString()), roundTo);
    } else {
        var decPlaces = roundTo,
            result = 0,
            max = 5;
        while (result == 0 && decPlaces <= max) {
            result = betterRound((dataIn * units[unitsIn.toString()][currentUnits[unitsIn.toString()]][0].toString()), decPlaces);
            if (isNaN(result) === true) {result = 0; }
            decPlaces += 1;
        }
        return result;
    }
}

function sharpenValue(valueIn) {
    //Return the coordinate value that will result in sharp lines being drawn
    return betterRound(valueIn, 0) + 0.5;
}

Chart.pluginService.register({
    beforeDraw: function (chart, easing) {
        if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
            var helpers = Chart.helpers;
            var ctx = chart.chart.ctx;
            var chartArea = chart.chartArea;

            ctx.save();
            ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
            ctx.fillRect(0, 0, 1000, 1000);
            ctx.restore();
        }
    }
});

function checkOverflow(el) {
    //Checks if an element has overflowing text, creit to: Shog9, http://stackoverflow.com/questions/143815/determine-if-an-html-elements-content-overflows
    var curOverflow = el.style.overflow;

    if ( !curOverflow || curOverflow === "visible" ) {
        el.style.overflow = "hidden";
    }

    var isOverflowing = el.clientWidth < el.scrollWidth
        || el.clientHeight < el.scrollHeight;

    el.style.overflow = curOverflow;

    return isOverflowing;
}

var numLoaded = 0,
    numWidgets = 0,
    widgetListKeys = Object.keys(widgetList);

for (i = 0; i < widgetListKeys.length; i++) {
    if (widgetList[widgetListKeys[i]].enabled === true) {numWidgets++; }
}

function checkOffLoaded() {
    //checks off when every widget finishes loading, and then sends the call to update. Only used as page loads.
    numLoaded += 1;
    if (numLoaded >= numWidgets) {
        loaded = true;
        tryUpdateWidgets();
    }
}
