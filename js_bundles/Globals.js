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
        nl: "Schijnbare",
        da: "Føles som",
        ro: "Aparentă",
        fr: "Apparent",
        gr: "Εμφανής",
        it: "Apparente",
        es: "Aparente",
        nb: "Tilsynelatende",
        bg: "Видима",
        cs: "Zdánlivý"
        
    },
    apparentDescription: {
        en: "Perceived temperature based on temperature, humidity, sun, and wind.",
        nl: "Waargenomen temperatuur gebaseerd op de temperatuur, vochtigheid, zon en wind.",
        da: "Opfattet temperatur baseret på temperatur, fugtighed, sol og vind",
        ro: "Temperatura percepută în funcție de temperatură, umiditate, soare şi vânt.",
        fr: "Température perçue en fonction de la température, de l'humidité, du soleil et du vent.",
		gr: "Θεωρημένη θερμοκρασία με βάση τη θερμοκρασία, την υγρασία, τον ήλιο και τον άνεμο.",
		it: "Temperatura percepita basata su temperatura, umidità, sole e vento.",
		es: "Temperatura percibida en función de la temperatura, la humedad, el sol y el viento.",
		nb: "Oppfattet temperatur basert på temperatur, fuktighet, sol og vind.",
		bg: "Възприемана температура, базирана на температура, влажност, слънце и вятър.",
		cs: "Vnímaná teplota na základě teploty, vlhkosti, slunce a větru."
    },
    temperatureTitle: {
        en: "Temperature",
        nl: "Temperatuur",
        da: "Temperatur",
        ro: "Temperatura",
		fr: "Température",
		gr: "Θερμοκρασία",
		it: "Temperatura",
		es: "Temperatura",
		nb: "Temperatur",
		bg: "Температура",
		cs: "Teplota"
    },
    temperatureDescription: {
        en: "Current air temperature.\nBlue: Low daily temperature.\nRed: High daily temperature.",
        nl: "Huidige luchttemperatuur. \nBlauw: Minimum dagelijkse temperatuur. \nRood: Maximum dagelijkse temperatuur.",
        da: "Aktuel lufttemperatur. \nBlå: Laveste daglige temperatur.\nRød: Højeste daglige temperatur.",
        ro: "Temperatura aerului curent.\nAlbastru: temperatura zilnică minimă.\nRosu: Temperatura zilnică maximă.",
		fr: "Température actuelle de l'air.\nBleu:Faible température journalière.\NRouge: Température élevée journalière.",
		gr: "Τρέχουσα θερμοκρασία αέρα.\nΜπλε: Χαμηλή ημερήσια θερμοκρασία.\nκόκκινος: Υψηλή ημερήσια θερμοκρασία.",
		it: "Temperatura dell'aria attuale.\nBlu: temperatura giornaliera bassa.\nRosso: temperatura giornaliera elevata.",
		es: "Temperatura del aire actual.\nAzul: temperatura diaria minima.\nRojo: temperatura diaria máxima.",
		nb: "Gjeldene temperatur.\nBlå: Lavest måling i dag.\nRød: Høyest måling i dag.",
		bg: "Текуща температура на въздуха.\nБлок: Ниска дневна температура.\nРед: Висока дневна температура.",
		cs: "Aktuální teplota vzduchu.\nModrá: Nízká denní teplota.\nČervené: Vysoká denní teplota."
    },
    barometerSteady: {
        en: "Steady",
        nl: "Bestendig",
        da: "Stabil",
        ro: "Constantă",
		fr: "Stable",
		gr: "Σταθερά",
		it: "Costante",
		es: "Estable",
		nb: "Stabil",
		bg: "Спокойно",
		cs: "Stabilní"
    },
    barometerRate: {
        en: "Rate",
        nl: "Trend",
        da: "Hastighed",
        ro: "Rata",
		fr: "Vitesse",
		gr: "Τιμή",
		it: "Vota",
		es: "Velocidad",
		nb: "Endring",
		bg: "Норма",
		cs: "Hodnotit"
    },
    barometerTitle: {
        en: "Barometer",
        nl: "Barometer",
        da: "Barometer",
        ro: "Barometrul",
		fr: "Baromètre",
		gr: "Βαρόμετρο",
		it: "Barometro",
		es: "Barometro",
		nb: "Barometer",
		bg: "Барометър",
		cs: "Barometr"
    },
    barometerDescription: {
        en: "The weight of the air, adjusted for the station's altitude.",
        nl: "Het gewicht van de lucht, aangepast naar de hoogte van het weerstation.",
        da: "Luftens vægt, justeret efter vejrstationens højde",
        ro: "Greutatea aerului, ajustată la altitudinea stației.",
		fr: "Le poids de l'air, ajusté pour l'altitude de la station.",
		gr: "Το βάρος του αέρα, προσαρμοσμένο στο υψόμετρο του σταθμού.",
		it: "Il peso dell'aria, regolato per l'altitudine della stazione.",
		es: "El peso del aire, ajustado para la altitud de la estación.",
		nb: "Vekten av luften, justert for stasjonens høyde.",
		bg: "Тежестта на въздуха, коригирана спрямо височината на станцията.",
		cs: "Hmotnost vzduchu, přizpůsobená výšce stanice."
    },
    windchillTitle: {
        en: "Windchill",
        nl: "Gevoelstemperatuur",
        da: "Kuldeindeks",
        ro: "Vânt tăios",
		fr: "Windchill",
		gr: "Δείκτης Ψύχρας",
		it: "Percepita",
		es: "Escalofríos",
		nb: "Vind faktor",
		bg: "Cилен вятър",
		cs: "Chlad vítr"
    },
    windchillDescription: {
        en: "How cold it actually feels. Calculated by combining heat and wind speed.",
        nl: "Hoe koud het daadwerkelijk aanvoelt. Wordt berekend door een combinatie van temperatuur en windsnelheid.",
        da: "Hvor koldt det føles. Beregnet ved at kombinere temperatur og vindhastighed.",
        ro: "Cât de frig se simte de fapt. Se calculează prin combinarea temperaturii și a vitezei vântului.",
		fr: "Comme il fait froid, c'est calculé en combinant la température et la vitesse du vent.",
		gr: "Πόσο κρύο αισθάνεται πραγματικά. Υπολογίζεται συνδυάζοντας τη θερμότητα και την ταχύτητα του ανέμου.",
		it: "Come fa veramente freddo, calcolato combinando il calore e la velocità del vento.",
		es: "Qué frío se siente realmente. Calculado combinando el calor y la velocidad del viento.",
		nb: "Hvor kaldt det føles. Beregnet ut fra temperatur og vindhastighet.",
		bg: "Колко студено се чувства, изчислено чрез комбиниране на топлина и скорост на вятъра.",
		cs: "Jak studené se skutečně cítí. Vypočítá se kombinací tepla a rychlosti větru."
    },
    humidityTitle: {
        en: "Humidity",
        nl: "Vochtigheid",
        da: "Luftfugtighed",
        ro: "Umiditatea",
		fr: "Humidité",
		gr: "Υγρασία",
		it: "Umidità",
		es: "Humedad",
		nb: "Fuktighet",
		bg: "Влажност",
		cs: "Vlhkost"
    },
    humidityDescription: {
        en: "The amount of water vapour in the air as a percentage of the amount the air is capable of holding.",
        nl: "De hoeveelheid verdampt water in de lucht als een percentage van de hoeveelheid lucht dat in staat is om vocht vast te houden.",
        da: "Mængden af vanddamp i luften som en procent af den mængde luften er i stand til at indeholde",
        ro: "Cantitatea de vapori de apă din aer ca procent din cantitatea de aer care poate fi menținută.",
		fr: "La quantité de vapeur d'eau dans l'air en pourcentage de la quantité que l'air est capable de contenir.",
		gr: "Η ποσότητα υδρατμών στον αέρα ως ποσοστό της ποσότητας που μπορεί να συγκρατήσει ο αέρας.",
		it: "La quantità di vapore acqueo nell'aria in percentuale della quantità di aria che è in grado di trattenere.",
		es: "La cantidad de vapor de agua en el aire como un porcentaje de la cantidad que el aire es capaz de contener.",
		nb: "En prosentandel av mengden vanndamp luften kan holde.",
		bg: "Количеството водни пари във въздуха като процент от количеството, което въздухът може да държи.",
		cs: "Množství vodní páry ve vzduchu jako procento množství, které může vzduch držet."
    },
    moonSunRise: {
        en: "Rise",
        nl: "Opkomst",
        da: "Opgang",
        ro: "Răsărit de soare",
		fr: "Lever",
		gr: "Ανατολή Ηλίου",
		it: "Alba",
		es: "Amanecer",
		nb: "Opp",
		bg: "Изгрев слънце",
		cs: "Svítání"
    },
    moonSunSet: {
        en: "Set",
        nl: "Ondergang",
        da: "Nedgang",
        ro: "Apus",
		fr: "Coucher",
		gr: "Δύση Ηλίου",
		it: "Tramonto",
		es: "Puesta de sol",
		nb: "Ned",
		bg: "Сън комплект",
		cs: "Západ slunce"
    },
    moonSunPhase: {
        en: "Phase",
        nl: "Fase",
        da: "Fase",
        ro: "Faza",
		fr: "Phase",
		gr: "Φάση",
		it: "Fase",
		es: "Fase",
		nb: "Fase",
		bg: "Фаза",
		cs: "Fáze"
    },
    moonSunAge: {
        en: "Age",
        nl: "Leeftijd",
        da: "Alder",
        ro: "Vârsta",
		fr: "Âge",
		gr: "ηλικία",
		it: "Età",
		es: "Edad",
		nb: "Alder",
		bg: "Възраст",
		cs: "Doba"
    },
    moonSunTitleSun: {
        en: "Sun",
        nl: "Zon",
        da: "Sol",
        ro: "Soarele",
		fr: "Soleil",
		gr: "Ήλιος",
		it: "Sole",
		es: "Sol",
		nb: "Sol",
		bg: "Cлънце",
		cs: "Slunce"
    },
    moonSunTitleMoon: {
        en: "Moon",
        nl: "Maan",
        da: "Måne",
        ro: "Luna",
		fr: "Lune",
		gr: "Σελήνη",
		it: "Luna",
		es: "Luna",
		nb: "Måne",
		bg: "Луна",
		cs: "Měsíc"
    },
    solarTitle: {
        en: "Solar",
        nl: "Zonkracht",
        da: "Solindstråling",
        ro: "Solar",
		fr: "Solaire",
		gr: "Ηλιακός",
		it: "Solare",
		es: "Solar",
		nb: "Solstråling",
		bg: "Cлънцето",
		cs: "Sluneční"
    },
    solarSunHours: {
        en: "Sun Hours",
        nl: "Zonuren",
        da: "Solskinstimer",
        ro: "Ore însorite",
		fr: "Heures du soleil",
		gr: "Ώρες Κυρ",
		it: "Ore di sole",
		es: "Horas de sol",
		nb: "Sol timer",
		bg: "Часове на слънцето",
		cs: "Hodiny slunce"
    },
    solarDescription: {
        en: "The intensity of the sun's radiation.",
        nl: "De intensiteit van de straling van de zon.",
        da: "Intensiteten af solens stråler",
        ro: "Intensitatea radiației solare.",
		fr: "L'intensité du rayonnement du soleil.",
		gr: "Η ένταση της ακτινοβολίας του ήλιου.",
		it: "L'intensità della radiazione solare.",
		es: "La intensidad de la radiación del sol.",
		nb: "Intensiteten av solens stråling.",
		bg: "Интензивността на слънчевото излъчване.",
		cs: "Intenzita slunečního záření."
    },
    statusNoDataSince: {
        en: "No data since",
        nl: "Geen data sinds",
        da: "Ingen data siden",
        ro: "Nu există date încă",
		fr: "Aucune donnée depuis",
		gr: "Δεν υπάρχουν δεδομένα από τότε",
		it: "Nessun dato da",
		es: "Sin datos desde",
		nb: "Ingen data siden",
		bg: "Няма данни оттогава",
		cs: "Žádné údaje od té doby"
    },
    statusDataAt: {
        en: "Latest data received at",
        nl: "Laatste data ontvangen op",
        da: "Sidste opdatering kl.",
        ro: "Ultimele date primite la",
		fr: "Dernières données reçues à",
		gr: "Τα τελευταία δεδομένα που ελήφθησαν στο",
		it: "Ultimi dati ricevuti a",
		es: "Últimos datos recibidos en",
		nb: "Sist oppdatert",
		bg: "Последни данни, получени от",
		cs: "Nejnovější údaje obdržené na adrese"
    },
    statusDescription: {
        en: "Green: New data collected from server.\nGrey: Data on server hasn't changed.\nYellow: Some error during data collection from server.\nRed: No data able to be collected from server.",
        nl: "Groen: Nieuwe data ontvangen van server. \nGrijs: Data op server is niet veranderd. \nGeel: Een foutmelding tijdens de ontvangst van de data van de server. \nRood: Geen data beschikbaar om te ontvangen van de server.",
        da: "Grøn: Friske data fra serveren.\nGrå: Data på serveren har ikke ændret sig.\nGul: Fejl under hentning af data fra serveren.\nRød: Ingen data fra serveren.",
        ro: "Verde: date noi colectate de pe server.\nVerde: datele de pe server nu s-au schimbat. \nGalben: Unele erori în timpul colectării de date de pe server.\nRosu: Nu există date care să poată fi colectate de pe server.",
		fr: "Vert: Nouvelles données collectées sur le serveur.\nGris: Les données sur le serveur n'ont pas changé.\nJaune: Erreur lors de la collecte des données du serveur. \ nRouge: Aucune donnée ne peut être collectée depuis le serveur.",
		gr: "Πράσινο: Νέα δεδομένα που έχουν συλλεχθεί από το διακομιστή.\nγκρί: Τα δεδομένα στο διακομιστή δεν έχουν αλλάξει.\nκίτρινος: Ορισμένα σφάλματα κατά τη συλλογή δεδομένων από το διακομιστή.\nκόκκινος: Δεν υπάρχουν δεδομένα που μπορούν να συλλεχθούν από το διακομιστή.",
		it: "Verde: nuovi dati raccolti dal server.\nGrigio: i dati sul server non sono cambiati.\nGlialo: alcuni errori durante la raccolta dei dati dal server.\nRosso: nessun dato può essere raccolto dal server.",
		es: "Verde: datos nuevos recopilados del servidor.\nGris: los datos en el servidor no han cambiado.\nAmarillo: algunos errores durante la recopilación de datos del servidor.\nRojo: no se pueden recopilar datos del servidor.",
		nb: "Grønn: Ny infomasjon er hentet fra værstasjon.\nGrå: Ingen forandringer.\nGul: Noen feil under datainnsamling fra værstasjon.\nRød: Ikke mulig å samle inn ny data fra værstasjon.",
		bg: "Зелена: Нови данни, събрани от сървъра.\nЧаст: Данните на сървъра не са се променили.\nНапред: Някои грешки при събирането на данни от сървъра.\nчервен: Няма данни, които да се събират от сървъра.",
		cs: "Zelená: nová data shromážděná ze serveru.\nŠedá: Údaje na serveru se nezměnily.\nŽlutá: Některé chyby při sběru dat ze serveru.\nČervená: Žádné údaje nemohou být shromážděny ze serveru."
        
    },
    rainfallTitle: {
        en: "Rainfall",
        nl: "Regen",
        da: "Regn",
        ro: "Precipitaţii",
		fr: "La pluie",
		gr: "Βροχή",
		it: "Precipitazioni",
		es: "Lluvia",
		nb: "Nedbør",
		bg: "Валежите",
		cs: "Srážky"
    },
    rainfallDailyTitle: {
        en: "Daily",
        nl: "Vandaag",
        da: "Daglig",
        ro: "Ziua",
		fr: "Jurnellement",
		gr: "Καθημερινά",
		it: "Quotidiano",
		es: "Diario",
		nb: "Dag",
		bg: "Eжедневно",
		cs: "Denně"
    },
    rainfallMonthlyTitle: {
        en: "Monthly",
        nl: "Deze Maand",
        da: "Månedlig",
        ro: "Lunar",
		fr: "Au mois",
		gr: "Μηνιαίος",
		it: "Mensile",
		es: "Mensual",
        nb: "Måned",
		bg: "Месечно",
		cs: "Měsíční"
    },
    rainfallAnnualTitle: {
        en: "Annual",
        nl: "Jaar Totaal",
        da: "Årlig",
        ro: "Anual",
		fr: "Annuel",
		gr: "Ετήσιος",
		it: "Annuale",
		es: "Anual",
		nb: "År",
		bg: "Годишен",
		cs: "Roční"
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
		cs: "UV"
    },
    uvDescription: {
        en:  "The intensity of UV radiation - 0-2 is minimal risk of skin damage whilst 8+ is very high.",
        nl: "De intensiteit van de UV straling - 0-2 is een minimaal risico op huidschade terwijl 8+ een hoog risico vormt.",
        da: "Intensiteten af UV stråling - 0-2 angiver minimal risiko for hudskader mens 8+ angiver meget høj risiko.",
        ro: "Intensitatea radiației UV - 0-2 reprezintă un risc minim de afectare a pielii, în timp ce 8+ este foarte mare.",
		fr: "L'intensité du rayonnement UV - 0-2 est un risque minime de lésions cutanées tandis que 8+ est très élevé.",
		gr: "Η ένταση της ακτινοβολίας UV - 0-2 είναι ο ελάχιστος κίνδυνος βλάβης του δέρματος ενώ το 8+ είναι πολύ υψηλό.",
		it: "L'intensità della radiazione UV - 0-2 è il minimo rischio di danni alla pelle mentre 8+ è molto alta.",
		es: "La intensidad de la radiación UV - 0-2 es un riesgo mínimo de daño a la piel, mientras que 8+ es muy alta.",
		nb: "Intensiteten til UV-stråling - 0-2 er minimal risiko for hudskade, mens 8+ er veldig høy.",
		bg: "Интензитетът на UV радиация - 0-2 е минимален риск от увреждане на кожата, докато 8+ е много висока.",
		cs: "Intenzita UV záření - 0-2 představuje minimální riziko poškození kůže, zatímco 8+ je velmi vysoké."
    },
    windDirectionLabelN: {
        en: "N",
        nl: "N",
        da: "N",
        ro: "N",
		fr: "N",
		gr: "B",
		it: "N",
		es: "N",
		nb: "N",
		bg: "C",
		cs: "S"
    },
    windDirectionLabelNE: {
        en: "NE",
        nl: "NO",
        da: "NØ",
        ro: "NE",
		fr: "NE",
		gr: "BA",
		it: "NE",
		es: "NE",
		nb: "NØ",
		bg: "CИ",
		cs: "SV"
    },
    windDirectionLabelE: {
        en: "E",
        nl: "O",
        da: "Ø",
        ro: "E",
		fr: "E",
		gr: "A",
		it: "E",
		es: "E",
		nb: "Ø",
		bg: "И",
		cs: "V"
    },
    windDirectionLabelSE: {
        en: "SE",
        nl: "ZO",
        da: "SØ",
        ro: "SE",
		fr: "SE",
		gr: "NA",
		it: "SE",
		es: "SE",
		nb: "SØ",
		bg: "ЮИ",
		cs: "JV"
    },
    windDirectionLabelS: {
        en: "S",
        nl: "Z",
        da: "S",
        ro: "S",
		fr: "S",
		gr: "N",
		it: "S",
		es: "S",
		nb: "S",
		bg: "Ю",
		cs: "J"
    },
    windDirectionLabelSW: {
        en: "SW",
        nl: "ZW",
        da: "SV",
        ro: "SV",
		fr: "SO",
		gr: "NΔ",
		it: "SO",
		es: "SO",
		nb: "SV",
		bg: "Юз",
		cs: "JZ"
    },
    windDirectionLabelW: {
        en: "W",
        nl: "W",
        da: "V",
        ro: "V",
		fr: "O",
		gr: "Δ",
		it: "O",
		es: "O",
		nb: "V",
		bg: "з",
		cs: "Z"
    },
    windDirectionLabelNW: {
        en: "NW",
        nl: "NW",
        da: "NV",
        ro: "NV",
		fr: "NO",
		gr: "BΔ",
		it: "NO",
		es: "NO",
		nb: "NV",
		bg: "cз",
		cs: "SZ"
    },
    windDirectionDescription: {
        en: "The wind direction. Blue arrow indicates average wind direction.",
        nl: "De windrichting. De groene pijl geeft de gemiddelde windrichting aan.",
        da: "Vindretning. Grøn pil angiver den gennemsnitlige vindretning.",
        ro: "Direcția vântului. Săgeata verde indică direcția medie a vântului.",
		fr: "La direction du vent La flèche verte indique la direction moyenne du vent.",
		gr: "Η διεύθυνση του ανέμου. Το πράσινο βέλος δείχνει τη μέση κατεύθυνση του ανέμου.",
		it: "La direzione del vento: la freccia verde indica la direzione media del vento.",
		es: "La dirección del viento. La flecha verde indica la dirección promedio del viento.",
		nb: "Vindretningen. Grønn pil indikerer gjennomsnittlig vindretning.",
		bg: "Посоката на вятъра. Зелената стрелка показва средната посока на вятъра.",
		cs: "The wind direction. Blue arrow indicates average wind direction."
    },
    windSpeedMax: {
        en: "max",
        nl: "Max",
        da: "max",
        ro: "max",
		fr: "max",
		gr: "mέγ",
		it: "max",
		es: "máx",
		nb: "max",
		bg: "mакс",
		cs: "max"
    },
    windSpeedTitle: {
        en: "Wind Speed",
        nl: "Windsnelheid",
        da: "Vindhastighed",
        ro: "Viteza vântului",
		fr: "Vitesse du vent",
		gr: "Ταχύτητα Ανέμου",
		it: "Velocità del vento",
		es: "Velocidad del viento",
		nb: "Vindstyrke",
		bg: "Скоростта на вятъра",
        cs: "Rychlost větru"
    },
    windSpeedWind: {
        en: "Wind \nAvg",
        nl: "Wind",
        da: "Vind",
        ro: "Vântul",
		fr: "Vent",
		gr: "Ταχύτητα",
		it: "Vento",
		es: "Viento",
		nb: "Vind",
		bg: "Вятър",
		cs: "Vítr"
    },
    windSpeedGust: {
        en: "Gust",
        nl: "Vlaag",
        da: "Stød",
        ro: "Rafale",
		fr: "Rafale",
		gr: "φύσημα",
		it: "Raffica",
		es: "Ráfaga",
		nb: "Kast",
		bg: "Рафал",
		cs: "Poryv"
    },
    windSpeedAverage: {
        en: "Average",
        nl: "Gemiddeld",
        da: "Gennemsnit",
        ro: "Media",
		fr: "Moyen",
		gr: "Μέση",
		it: "Media",
		es: "Media",
		nb: "Gjennomsnitt",
		bg: "Средна",
		cs: "Průměrný"
    },
    windSpeedDescription: {
        en: "Blue bar indicates average wind speed.\nPurple bar indicates gust speed.",
        nl: "Groene balk geeft de gemiddelde windsnelheid aan. \nPaarse balk geeft de windsnelheid in vlagen aan.",
        da: "Grøn bjælke angiver middelvind.\nLilla bjælke angiver vindstød.",
        ro: "Bara verde indică viteza medie a vântului.\nVioleta scurtă indică viteza de rafală.",
		fr: "La barre verte indique la vitesse moyenne du vent.\nViolet barre verticale indique la vitesse du vent.",
		gr: "Η πράσινη ράβδος δείχνει τη μέση ταχύτητα του ανέμου.\nμωβ ράβδος σκουριάς δείχνει την ταχύτητα της ριπής.",
		it: "La barra verde indica la velocità media del vento.\nPurple barra indica la velocità della raffica.",
		es: "La barra verde indica la velocidad promedio del viento.\npúrpura color indica la velocidad de ráfaga.",
		nb: "Grønn: Indikerer gjennomsnittlig vindhastighet.\nLilla: indikerer vindhastighet akuratt nå (vindkast).",
		bg: "Зелената лента показва средната.\nпурпурен скорост на вятъра.",
		cs: "Zelená čára označuje průměrnou rychlost větru.\nKurzní lišta označuje rychlost poryvu."
    },
    recordsHighTemp: {
        en: "Highest temperature",
        nl: "Hoogste temperatuur",
        da: "Højeste temperatur",
        ro: "Recordul de temperatură mare",
		fr: "La plus haute température",
		gr: "Υψηλότερη θερμοκρασία",
		it: "Temperatura massima",
		es: "Temperatura más alta",
		nb: "Høyeste temperatur",
		bg: "Най-висока температура",
		cs: "Nejvyšší teplota"
    },
    recordsLowTemp: {
        en: "Lowest temperature",
        nl: "Laagste temperatuur",
        da: "Laveste temperatur",
        ro: "Recordul de temperatură mică",
		fr: "Température la plus basse",
		gr: "Χαμηλότερη θερμοκρασία",
		it: "Temperatura più bassa",
		es: "Temperatura más baja",
		nb: "Laveste temperatur",
		bg: "Най-ниска температура",
		cs: "Nejnižší teplota"
    },
    recordsHighGust: {
        en: "Highest gust",
        nl: "Sterkste vlaag",
        da: "Kraftigste vindstød",
        ro: "Recordul rafalelor",
		fr: "La plus haute rafale",
		gr: "Υψηλότερη φύσημα",
		it: "Il più alto gusto",
		es: "Mayor ráfaga",
		nb: "Kraftigste vindkast",
		bg: "Най-висок вкус",
		cs: "Nejvyšší poryv"
    },
    recordsHighRainRate: {
        en: "Highest rain rate",
        nl: "Hoogste hoeveelheid regen",
        da: "Højeste regnrate",
        ro: "Recordul ratei ploii",
		fr: "Le plus haut taux de pluie",
		gr: "Υψηλότερη βροχόπτωση",
		it: "Tasso di pioggia più alto",
		es: "Tasa de lluvia más alta",
		nb: "Høyeste endring i nedbør",
		bg: "Най-висока дъждовна скорост",
		cs: "Nejvyšší déšť"
    },
    recordsLowBaro: {
        en: "Lowest barometer",
        nl: "Laagste stand barometer",
        da: "Laveste lufttryk",
        ro: "Recordul presiunii scăzute",
		fr: "Le plus bas baromètre",
		gr: "Χαμηλότερο βαρόμετρο",
		it: "Barometro più basso",
		es: "Barómetro más bajo",
		nb: "Lavest barometertrykk",
		bg: "Най-нисък барометър",
		cs: "Nejnižší barometr"
    },
    recordsHighBaro: {
        en: "Highest barometer",
        nl: "Hoogste stand barometer",
        da: "Højeste lufttryk",
        ro: "Recordul presiunii mari",
		fr: "Le plus haut baromètre",
		gr: "Υψηλότερο βαρόμετρο",
	    it:	"Barometro più alto",
		es: "Barómetro más alto",
		nb: "Høyest barometertrykk",
		bg: "Най-висок барометър",
		cs: "Nejvyšší barometr"
    },
    recordsHighRainRateDaily: {
        en: "Highest daily rainfall",
        nl: "Hoogste dagelijkse hoeveelheid regen",
        da: "Højeste daglige regnmængde",
        ro: "Recordul pentru cele mai mari precipitații zilnice",
		fr: "La plus grande pluviométrie quotidienne",
		gr: "Υψηλότερη ημερήσια βροχόπτωση",
		it: "Pioggia giornaliera massima",
		es: "La mayor cantidad de lluvia diaria",
		nb: "Høyeste daglige nedbør",
		bg: "Най-високи дневни валежи",
		cs: "Nejvyšší denní srážky"
    },
    recordsHighRainRateHourly: {
        en: "Highest hourly rainfall",
        nl: "Hoogste hoeveelheid regen per uur",
        da: "Højeste regnmængde pr. time",
        ro: "Cea mai mare ploaie orară",
		fr: "Les plus hautes précipitations horaires",
		gr: "Υψηλότερη ωριαία βροχόπτωση",
		it: "Pioggia orario più alta",
		es: "Mayor precipitación por hora",
		nb: "Høyest nedbør pr.timen",
		bg: "Най-високи часови валежи",
		cs: "Nejvyšší hodinové srážky"
    },
    recordsHighAverageWind: {
        en: "Highest average wind speed",
        nl: "Hoogste gemiddelde windsnelheid",
        da: "Kraftigste middelvind",
        ro: "Cea mai mare viteză medie a vântului",
		fr: "Vitesse moyenne du vent la plus élevée",
		gr: "Μέγιστη μέση ταχύτητα ανέμου",
		it: "Velocità del vento media più alta",
		es: "Velocidad promedia del viento más alta",
		nb: "Kraftigste Gj.snitt vindstyrke",
		bg: "Най-висока средна скорост на вятъра",
		cs: "Nejvyšší průměrná rychlost větru"
    },
    recordsLowWindChill: {
        en: "Lowest wind chill",
        nl: "Laagste gevoelstemperatuur",
        da: "Laveste kuldeindeks",
        ro: "Cel mai scăzut vânt tăios",
		fr: "Le plus froid du vent",
		gr: "Ο ψυχρότερος άνεμος",
		it: "Vento più freddo",
		es: "Frío del viento más bajo",
		nb: "Laveste følt tempratur",
		bg: "Най-слаб вятър",
		cs: "Nejnižší chlad vítr"
    },
    recordsWarmestDay: {
        en: "Warmest day",
        nl: "Warmste dag",
        da: "Varmeste dag",
        ro: "Ziua cea mai caldă",
		fr: "Le jour le plus chaud",
		gr: "Ζεστή ημέρα",
		it: "Giorno più caldo",
		es: "El día más cálido",
		nb: "Varmest dag (Snitt 6-18)",
		bg: "Най-топъл ден",
		cs: "Nejteplejší den"
    },
    recordsColdestNight: {
        en: "Coldest night",
        nl: "Koudste nacht",
        da: "Koldeste nat",
        ro: "Noaptea cea mai rece",
		fr: "Nuit la plus froide",
		gr: "Η πιο ψυχρή νύχτα",
		it: "Notte più fredda",
		es: "La noche más fría",
		nb: "Kaldest natt (Snitt 18-6)",
		bg: "Най-студена нощ",
		cs: "Nejchladnější noc"
    },
    recordsColdestDay: {
        en: "Coldest day",
        nl: "Koudste dag",
        da: "Koldeste dag",
		ro: "Ziua cea mai rece",
		fr: "Le jour le plus froid",
		gr: "Η πιό ψυχρή ημέρα",
		it: "Giorno più freddo",
		es: "Día más frío",
		nb: "Kaldest dag (Snitt 6-18)",
		bg: "Най-студен ден",
		cs: "Nejchladnější den"
    },
    recordsWarmestNight: {
        en: "Warmest night",
        nl: "Warmste nacht",
        da: "Varmeste nat",
        ro: "Cea mai caldă noapte",
		fr: "La nuit la plus chaude",
		gr: "Ζεστή νύχτα",
		it: "Notte più calda",
		es: "La noche más cálida",
		nb: "Varmest natt (Snitt 18-6)",
		bg: "Най-топлата нощ",
		cs: "Teplá noc"
    },
    recordsHighHeatIndex: {
        en: "Highest heat index",
        nl: "Hoogste warmte index",
        da: "Højeste varmeindeks",
        ro: "Recordul indicelui de căldură",
		fr: "Indice de chaleur le plus élevé",
		gr: "Υψηλότερος δείκτης θερμότητας",
		it: "Indice di calore più alto",
		es: "Índice de calor más alto",
		nb: "Høyeste følt varme",
		bg: "Най-висок топлинен индекс",
		cs: "Highest heat index"
    },
    recordsHighSolar: {
        en: "Highest solar",
        nl: "Hoogste zonkracht",
        da: "Højeste solindstråling",
        ro: "Cel mai înalt nivel solar",
		fr: "Plus haut solaire",
		gr: "Υψηλότερο ηλιακό",
		it: "Il più alto solare",
		es: "Más alto solar",
		nb: "Høyeste solenergi",
		bg: "Най-високото слънчево",
		cs: "Nejvyšší sluneční"
    },
    recordsHighUV: {
        en: "Highest uv index",
        nl: "Hoogste uv index",
        da: "Højeste uv indeks",
        ro: "Cel mai înalt nivel UV",
		fr: "Plus haut indice UV",
		gr: "Υψηλότερο ευρετήριο UV",
		it: "Indice UV più alto",
		es: "Índice UV más alto",
		nb: "Høyeste UV-indeks",
		bg: "Най-висок UV индекс",
		cs: "Nejvyšší index UV"
    },
    recordsHighDewPoint: {
        en: "Highest dew point",
        nl: "Hoogste dauwpunt",
        da: "Højeste dugpunkt",
        ro: "Record de punct de rouă ridicat",
		fr: "Plus haut point de rosée",
		gr: "Υψηλότερο σημείο δρόσου",
		it: "Punto di rugiada più alto",
		es: "Punto de rocío más alto",
		nb: "Høyeste duggpunkt",
		bg: "Най-висока точка на роса",
		cs: "Nejvyšší rosný bod"
    },
    recordsLowDewPoint: {
        en: "Lowest dew point",
        nl: "Laagste dauwpunt",
        da: "Laveste dugpunkt",
        ro: "Record de punct rouă scazut",
		fr: "Point de rosée le plus bas",
		gr: "Χαμηλότερο σημείο δρόσου",
		it: "Punto di rugiada più basso",
		es: "Punto de rocío más bajo",
		nb: "Laveste duggpunkt",
		bg: "Най-ниска точка на оросяване",
		cs: "Nejnižší rosný bod"
    },
    forcastShowMore: {
        en: "Show More",
        nl: "Toon meer",
        da: "Vis mere",
        ro: "Afișați mai multe",
		fr: "Montre plus",
		gr: "Δείτε περισσότερα",
        it: "Mostra di più",
		es: "Mostrar más",
        nb: "Vis mer",
		bg: "Покажи повече",
		cs: "Zobrazit více"
    },
    graphMax: {
        en: "Max",
        nl: "Max",
        da: "Max",
        ro: "Max",
		fr: "Max",
		gr: "Μέγ",
		it: "Max",
		es: "Máx",
		nb: "Max",
		bg: "Mакс",
		cs: "Max"
    },
    graphMin: {
        en: "Min",
        nl: "Min",
        da: "Min",
        ro: "Min",
		fr: "Min",
		gr: "Ελά",
		it: "Min",
		es: "Mín",
		nb: "Mín",
		bg: "Мин",
		cs: "Min"
    },
    graphLast: {        //NOTE: these are used as in: Last XX days, or Last XX Hours, etc.
        en: "Last",
        nl: "Laatste",
        da: "Sidste",
        ro: "Ultimele",
		fr: "Dernier",
		gr: "τελευταίος",
		it: "Ultimo",
		es: "Últimas",
        nb: "Siste",
		bg: "Миналата",
		cs: "Poslední"
    },
    graphDays: {
        en: "Days",
        nl: "Dagen",
        da: "Dage",
        ro: "Zile",
		fr: "Journées",
		gr: "Ημέρες",
		it: "Giorni",
		es: "Dias",
		nb: "Dager",
		bg: "дни",
		cs: "Dny"
    },
    graphHours: {
        en: "Hours",
        nl: "Uur",
        da: "Timer",
        ro: "Ore",
		fr: "Heures",
		gr: "Ωρες",
		it: "Ore",
		es: "Horas",
        nb: "Timer",
		bg: "Часа",
		cs: "Hodiny"
    },
    graphHour: {
        en: "Hour",
        nl: "Uur",
        da: "Time",
        ro: "Ora",
		fr: "Heure",
		gr: "Ωρα",
		it: "Ora",
		es: "Hora",
		nb: "Time",
		bg: "Час",
		cs: "Hodina"
        
    },
    graphMonths: {
        en: "Months",
        nl: "Maanden",
        da: "Måned",
        ro: "Luna",
		fr: "Mois",
		gr: "Μήνες",
		it: "Mesi",
		es: "Meses",
        nb: "Måned",
		bg: "Месеци",
		cs: "Měsíce"
    },
    graphBaroLabel: {
        en: "Pressure",
        nl: "Luchtdruk",
        da: "Lufttryk",
        ro: "Presiunea",
		fr: "Pression",
		gr: "Πίεση",
		it: "Pressione",
		es: "Presión",
		nb: "Lufttrykk",
		bg: "Налягане",
		cs: "Tlak"
    },
    graphHumidityLabel: {
        en: "Percent",
        nl: "Procent",
        da: "Procent",
        ro: "Procentul",
		fr: "Pour cent",
		gr: "Τοις εκατό",
		it: "Percentuale",
		es: "Porcentaje",
		nb: "Prosent",
		bg: "Процент",
		cs: "Procent"
    },
    graphSolarLabel: {
        en: "Irradiance",
        nl: "Instraling",
        da: "Indstråling",
        ro: "Radiația",
		fr: "Irradiance",
		gr: "Ακτινοβολία",
		it: "Irradiazione",
		es: "Radiación",
		nb: "",
		bg: "Irradiance",
		cs: "Ozáření"
    },
    graphLabelUV: {
        en: "Index",
        nl: "Index",
        da: "Indeks",
        ro: "Index",
		fr: "Indice",
		gr: "Δείκτης",
		it: "Indice",
		es: "Índice",
		nb: "Index",
		bg: "Индекс",
		cs: "Index"
    },
    graphLabelWindDirection: {
        en: "Wind Direction",
        nl: "Windrichting",
        da: "Vindretning",
        ro: "Direcția vântului",
		fr: "Direction du vent",
		gr: "Κατεύθυνση ανέμου",
		it: "La direzione del vento",
		es: "Dirección del viento",
        nb: "Vindretning",
		bg: "Посока на вятъра",
		cs: "Směr větru"
    },
    buttonLabelGraphs: {
        en: "Graphs",
        nl: "Grafieken",
        da: "Grafer",
        ro: "Grafice",
		fr: "Graphique",
		gr: "διάγραμμα",
		it: "Grafici",
		es: "Gráficos",
		nb: "Grafer",
		bg: "Графики",
		cs: "Grafy"
    },
    buttonLabelRecords: {
        en: "Records",
        nl: "Records",
        da: "Rekorder",
        ro: "Recorduri",
		fr: "Records",
		gr: "Εγγραφές",
		it: "Records",
		es: "Archivos",
		nb: "Rekorder",
		bg: "Pекорд",
		cs: "Evidence"
    },
    buttonLabelAltitude: {
        en: "Altitude",
        nl: "Hoogte",
        da: "Højde",
        ro: "Altitudinea",
		fr: "Altitude",
		gr: "Υψόμετρο",
		it: "Altitudine",
		es: "Altitud",
		nb: "Høyde",
		bg: "Bисочина",
		cs: "Nadmořská výška"
    },
    recordsForMonth: {
        en: "Records for this month",
        nl: "Records voor deze maand",
        da: "Rekorder for denne måned",
        ro: "Recordul pentru aceasta lună",
		fr: "Records pour ce mois",
		gr: "Εγγραφές για αυτόν τον μήνα",
		it: "Record per questo mese",
		es: "Registros para este mes",
		nb: "Rekorder denne måneden",
		bg: "Записи за този месец",
		cs: "Záznamy za tento měsíc"
    },
    recordsForYear: {
        en: "Records for this year",
        nl: "Records voor dit jaar",
        da: "Rekorder for dette år",
        ro: "Recordul pentru acest an",
		fr: "Records pour cette année",
		gr: "Εγγραφές για το τρέχον έτος",
		it: "Record per quest'anno",
		es: "Registros para este año",
		nb: "Rekorder i år",
		bg: "Рекорди за тази година",
		cs: "Záznamy pro tento rok"
    },
    recordsAllTime: {
        en: "All time records",
        nl: "Records aller tijden",
        da: "Rekorder siden start",
        ro: "Recordul pentru toți anii",
		fr: "Tous les records de temps",
		gr: "Όλες οι εγγραφές χρόνου",
		it: "Record di tutti i tempi",
		es: "Registros de todos los tiempos",
		nb: "Rekorder totalt",
		bg: "Всички времеви записи",
		cs: "Všechny záznamy času"
    },
    forecastTitle: {
        en: "Forecast",
        nl: "Voorspelling",
        da: "Vejrudsigt",
        ro: "Prognoza",
		fr: "Prévision",
		gr: "Πρόβλεψη",
		it: "Prevedere",
		es: "Pronóstico",
		nb: "Værvarsel",
		bg: "Прогноза",
		cs: "Předpověď"
    },
    heatIndexTitle: {
        en: "Heat Index",
        nl: "Hitte Index",
        da: "Varmeindeks",
        ro: "Indicele de caldură",
		fr: "Indice de chaleur",
		gr: "Δείκτης θερμότητας",
		it: "Indice di calore",
		es: "Índice de calor",
		nb: "Følt varme",
		bg: "Индекс на топлина",
		cs: "Teplo index"
    },
    heatIndexDescription: {
        en: "How hot it really feels when relative humidity is factored with the actual air temperature.",
        nl: "De warmte-index is een getal dat aangeeft hoe een mens gemiddeld een temperatuur in combinatie met een bepaalde vochtigheidsgraad beleeft, hoe hij of zij dit aanvoelt.",
        da: "Hvor varmt det føles når luftfugtigheden kombineres med luftens temperatur.",
        ro: "Cât de cald se simte cu adevărat atunci când umiditatea relativă este luată în considerare cu temperatura reală a aerului.",
		fr: "Comme il fait chaud quand l'humidité relative est prise en compte avec la température de l'air.",
		gr: "Πόσο ζεστό αισθάνεται πραγματικά όταν η σχετική υγρασία υπολογίζεται με την πραγματική θερμοκρασία του αέρα.",
		it: "Quanto fa veramente caldo quando l'umidità relativa viene calcolata con la temperatura dell'aria effettiva.",
		es: "Qué calor realmente se siente cuando la humedad relativa se tiene en cuenta con la temperatura real del aire.",
		nb: "Hvor varmt det virkelig føles når den relative luftfuktigheten er tatt med i selve lufttemperaturen..",
		bg: "Колко горещо наистина се чувства, когато относителната влажност се отчита с действителната температура на въздуха.",
		cs: "Jak horko to opravdu cítí, když je relativní vlhkost zohledněna skutečnou teplotou vzduchu."
    },
    beaufortScaleTitle: {
        en: "Beaufort Scale",
        nb: "Beaufort Skala"
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
        barometer: "0, 250, 255",
        rainfall: "0, 71, 183",
        wind: "88, 130, 226",
        windGust: "137, 79, 255",
        humidity: "16, 217, 244",
        solar: "245, 193, 18",
        temp: "255, 37, 37",
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
    temperature: {enabled: true},
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
    solar: {enabled: true},
    status: {enabled: true},
    rainfallTitle: {enabled: true},
    rainfallDay: {enabled: true},
    rainfallMonth: {enabled: true},
    rainfallYear: {enabled: true},
    UV: {enabled: true},
    windDirection: {enabled: true},
    windSpeed: {enabled: true}
};
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
    document.getElementById("Version").innerHTML = "FreshWDL - Version: 1.1.7.1 Alpha. yerren@renerica.com";
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