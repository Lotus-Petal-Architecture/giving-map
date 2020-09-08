/* STRING FUNCTIONS */
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getFormattedDate(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');

    return month + '/' + day + '/' + year;
}

Array.prototype.distinct = function (item) {
    var results = [];
    for (var i = 0, l = this.length; i < l; i++)
        if (!item) {
            if (results.indexOf(this[i]) === -1)
                results.push(this[i]);
        } else {
            if (results.indexOf(this[i][item]) === -1)
                results.push(this[i][item]);
        }
    return results;
};

const mergeById = (a1, a2) =>
    a1.map(itm => ({
        ...a2.find((item) => (item.FIPS === itm.properties.FIPS) && item),
        ...itm
    }));

const mergeByIdAgain = (a1, a2) =>
    a1.map(itm => ({
        ...a2.find((item) => (item.FIPS === itm.FIPS) && item),
        ...itm
    }));

const mergeByIdGrowth = (a1, a2) =>
    a1.map(itm => ({
        ...a2.find((item) => (item.fips === itm.FIPS) && item),
        ...itm
    }));

const mergeByIdFips = (a1, a2) =>
    a1.map(itm => ({
        ...a2.find((item) => (item.fips === itm.fips) && item),
        ...itm
    }));


/* LEAFLET.JS */

var layer = new L.StamenTileLayer('toner-lite');

var maxBounds = [
    [-56.992883, -241.034546],
    [83.820492, 3.652954]
];

var fitBounds = [
    [16.474279, -125.887527],
    [52.379791, -62.782059]
];

var map = new L.map('map', {
    center: [30, -98],
    zoom: 3,
    minZoom: 3,
    maxZoom: 12,
    zoomDelta: 2,
    maxBounds: maxBounds,
    bounceAtZoomLimits: false
}).fitBounds(fitBounds);

map.addLayer(layer);

var layerPrev;
var geojson;


// Choropleth colors
function getColorConfirmedGrowth(d) {
    return d > 100 ? '#5f0000' :
        d > 75 ? '#dc0005' :
        d > 50 ? '#ff4d00' :
        d > 25 ? '#FFFF00' :
        d > 10 ? '#8EB091' :
        d > 5 ? '#108503' :
        '#013220';
}

function style(feature) {
    return {
        fillColor: getColorConfirmedGrowth(feature.growthrate),
        weight: 1,
        opacity: 1,
        color: '#777',
        fillOpacity: 0.9
    };
}

function styleStates(feature) {
    return {
        weight: 2,
        opacity: 1,
        color: '#333',
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 2,
        color: '#ADFF2F',
        dashArray: '',
        fillOpacity: 0.7,
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature);
    panelcontent.update(layer.feature);
    layerPrev = layer;
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

function zoomToFeature(e) {
    $('.panel-wrapper').css({
        bottom: -$('.panel-content').height()
    });
    if (layerPrev) {
        resetHighlight(layerPrev);
    }
    highlightFeature(e);
    info.update(e.target.feature);
    panelcontent.update(e.target.feature);
    map.fitBounds(e.target.getBounds(), {
        padding: [100, 100]
    });
}

function onEachFeature(feature, layer) {
    layer.on({
        preclick: highlightFeature,
        click: zoomToFeature
    });
}

var stateslayer = L.geoJson(us_states, {
    style: styleStates,
    onEachFeature: onEachFeature,
    interactive: false
});
map.on('zoomend', function () {
    currentZoom = map.getZoom();
    if (currentZoom < 5) {
        stateslayer.setStyle({
            weight: 1
        });
    } else {
        stateslayer.setStyle({
            weight: 2
        });
    }
});

var info = L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function (props) {
    this._div.innerHTML = '<h3>US COVID-19 Cases by County</h3>' +
        (props ? '<b>' + props.properties.NAME + (props.properties.STATENAME ? ', ' + props.properties.STATENAME : '') +
            '</b><br />Confirmed: ' + (props.Confirmed ? numberWithCommas(props.Confirmed) : '0') +
            '<br />Deaths: ' + (props.Deaths ? numberWithCommas(props.Deaths) : '0') +
            '<br />Population: ' + (props.POPESTIMATE2019 ? numberWithCommas(props.POPESTIMATE2019) : '0') +
            '<br />New Cases, Past 14 Days: ' + (props.growthdiff ? numberWithCommas(props.growthdiff) : '0') +
            '<br />New Cases Per 10,000 Residents,<br />Past 14 Days<b>: ' + (props.growthrate ? numberWithCommas(props.growthrate) : '0') + '</b>' +
            '<br /><span class="infoupdated">Last Updated: ' + (props.Last_Update ? props.Last_Update : '0') + ' EST</span>' +
            '<div class="tab-text" style="margin-top: 10px;">GIVE NOW</div>' :
            'Click on a county for current data.<br /><br /><div class="tab-text">GIVE NOW</div>');
};

info.addTo(map);

var legend = L.control({
    position: 'bottomright'
});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 5, 10, 25, 50, 75, 100],
        labels = ['<div class="header-text">New Cases Per 10,000 Past 14 Days</div>'],
        from, to;

    for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
            '<i style="background:' + getColorConfirmedGrowth(from) + '"></i> ' +
            from + (to ? '&ndash;' + to : '+'));
    }

    div.innerHTML = labels.join('<br>');
    return div;
};
legend.addTo(map);

map.attributionControl.setPrefix('Color code shows new cases per 10,000 people over 14 days. COVID-19 data provided by <a href="https://coronavirus.jhu.edu/us-map" target="_blank">Johns Hopkins University</a>. Population data provided by <a href="https://www.census.gov/" target="_blank">US Census Bureau</a> Credits: <a href="https://leafletjs.com/" target="_blank">Leaflet</a>');

var panelcontent = L.control({
    position: 'bottomleft'
});

panelcontent.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'panel-wrapper');

    L.DomEvent.disableClickPropagation(this._div);
    L.DomEvent.on(this._div, 'mousewheel', L.DomEvent.stopPropagation);
    L.DomEvent.on(this._div, 'mousedown', L.DomEvent.stopPropagation);
    L.DomEvent.on(this._div, 'touchstart', L.DomEvent.stopPropagation);

    this.update();
    return this._div;
};

panelcontent.update = function (props) {
    this._div.innerHTML = '<div class="panel-controller"><div class="tab-controller">' +
        '<div class="close tab-text">GIVE NOW</div>' +
        '<div class="show tab-text">GIVE NOW</div>' +
        '</div></div>' +
        '<div class="panel-content">' +
        (props ? '<div class="panel-content-div"><h3>Donate to a local charity:</h3>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=Hospital&bay=search.results&EIN=&cgid=&cuid=&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Hospitals and Primary Care <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Hospitals and Primary Care</strong><br />Organizations focused on supporting our first responders, medical professionals, and other health care workers who are on the front lines working tirelessly to help the sick. This includes organizations that are supporting families and individuals with medical costs related to COVID-19 treatment and prevention.</span></p>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=Mental+Health&bay=search.results&EIN=&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Mental Health <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Mental Health</strong><br />Organizations focused on supporting the millions of Americans who have become unemployed or underemployed during this time. Can include: support in receiving unemployment benefits or other government assistance, job searching, occupationalreadiness, etc.</span></p>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=&bay=search.results&EIN=&cgid=3&cuid=&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Education and Training <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Education and Training</strong><br />Organizations focused on supporting the millions of Americans who have become unemployed or underemployed during this time. Can include: support in receiving unemployment benefits or other government assistance, job searching, occupational readiness, etc. </span></p>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=&bay=search.results&EIN=&cgid=6&cuid=18&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Food Insecurity <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Food Insecurity</strong><br />Organizations focused on providing free food distribution to individuals and families hardest hit by COVID-19.</span></p>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=&bay=search.results&EIN=&cgid=6&cuid=28&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Shelter Insecurity <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Shelter Insecurity</strong><br />Organizations supporting homeless / houseless populations, whose already limited resources have been squeezed by the economic impacts of the virus, and who may have a harder time with social distancing and attaining PPE, health care, etc. </span></p>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=&bay=search.results&EIN=&cgid=4&cuid=10&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Parks and Forests <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Parks and Forests</strong><br />Organizations focused on reducing negative environmental impacts caused by COVID-19 - including addressing the disturbing rise in deforestation (a main contributor to the emergence of new viruses) and illegal poaching. This includes increasing support for green energy and reducing carbon footprints. In addition to support for National Parks whose budgets may have been affected by shutdowns. </span></p>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=Emergency&bay=search.results&EIN=&cgid=&cuid=&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Emergency Response <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Emergency Response</strong><br />A "catch all" category focused around mobilizing and channeling immediate assistance and resources to individuals and communities in crisis - typically those that are already vulnerable and struggling. This can include everything from supplies to urgent care and other supports. The goal is to curb collateral damages as much as possible.</span></p>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=Supplies&bay=search.results&EIN=&cgid=&cuid=&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Equipment and Supplies <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Equipment and Supplies</strong><br />Organizations focused on supporting individuals and organizations who are making masks and Personal Protective Equipment (PPE) for those in need or who cannot afford them. These activities are filling the gap of industries who cannot generate these life-saving equipment and materials fast enough to meet the needs of the country.</span></p>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=&bay=search.results&EIN=&cgid=6&cuid=17&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Children, Families, Youth and the Elderly <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Children, Families, Youth and the Elderly</strong><br />Organizations focused on supporting families with young children who may be struggling with issues such as childcare, social, or educational supports. Also looking to help the elderly who are our most vulnerable population - finding ways to support them with resources such as food delivery, wellness care, social visits, etc.</span></p>' +
            '<p><a href="https://www.charitynavigator.org/index.cfm?keyword_list=&bay=search.results&EIN=&cgid=2&cuid=&location=2&state=' + props.properties.STATECODE + '&city=&overallrtg=&size=&scopeid=" target="_blank">Community and Culture <span class="gobtn">Go</span></a>' +
            '<span class="description"><strong>Community and Culture</strong><br />Organizations focused on supporting the arts and cultural community sector. Many performing artists such as musicians and actors, are unable to work right now due to the virus, and may have trouble accessing unemployment benefits due to the nature of the gig economy. We recognize that art is a cultural asset that must be protected.</span></p>' +
            '<div style="margin-top: 10px;">&copy; 2020 GreenSlate.us</div>' +
            '</div><div id="catdescription">Click any of the COVID-19 relief categories to donate immediately to a registered local charity.</div>'


            :
            '<div class="panel-content-div nocats"><h3>Donate to a local charity:</h3>Pick a county from the Greenslate map. Then click any of the COVID-19 relief categories to donate immediately to a registered local charity.<div style="margin-top: 10px;">&copy; 2020 GreenSlate.us</div></div>') +
        '</div>';

};

panelcontent.addTo(map);


/* COVID-19 API DATA*/

var county_names = [];
var total_cases = []; //total confirmed cases
var total_deaths = []; //total deaths

var old_cases = [];
var old_deaths = [];

var growthcalc = [];
var growthcalc_today = [];
var growthcalc_tenday = [];

var growthrates = [];

function growth_percent_calc(confirmed, old_confirmed, population) {
    var growth_calc = ((population > 10000) ? ((confirmed - old_confirmed) / (population / 10000)) : (confirmed - old_confirmed));
    growth_calc = growth_calc.toFixed(0);

    if (growth_calc < 0 || isNaN(growth_calc)) growth_calc = 'Unavailable';

    return growth_calc;
}

function growth_percent_diff(confirmed, old_confirmed, population) {
    var growth_calc = ((confirmed - old_confirmed));
    growth_calc = growth_calc.toFixed(0);

    if (growth_calc < 0 || isNaN(growth_calc)) growth_calc = 'Unavailable';

    return growth_calc;
}

(function () {
    covid19_data = mergeByIdAgain(covid19_data, population);

    var dates = covid19_data.distinct('Last_Update');
    last_updated = dates[0];

    for (var i = 0; i < covid19_data.length; i++) {
        var county = covid19_data[i];
        var county_name = county.Admin2 + ' County, ' + county.Province_State + ', ' + county.Country_Region;
        var county_confirmed = county.Confirmed;
        var county_deaths = county.Deaths;
        var old_confirmed = county.Confirmed;
        var fips = county.FIPS;
        var popest = county.POPESTIMATE2019;

        if (county.Last_Update == dates[0]) {
            county_names.push([county_name]);
            total_cases.push([county_confirmed]);
            total_deaths.push([county_deaths]);
            growthcalc_today.push({
                'fips': fips,
                'today': county_confirmed,
                'population': popest
            });
        }
    }

    for (var i = 0; i < covid19_data.length; i++) {
        var county = covid19_data[i];
        var county_confirmed = county.Confirmed;
        var fips = county.FIPS;

        if (county.Last_Update == dates[1]) {
            growthcalc_tenday.push({
                'fips': fips,
                'old': county_confirmed
            });
        }
    }

    growth_calc = mergeByIdFips(growthcalc_today, growthcalc_tenday);

    covid19_counties = mergeById(us_counties.features, population);

    for (var i = 0; i < growth_calc.length; i++) {
        var county = growth_calc[i];
        var today = county.today;
        var old = county.old;
        var fips = county.fips;
        var countypop = county.population;
        var county_growthdiff = growth_percent_diff(today, old, countypop);
        var county_growthrate = growth_percent_calc(today, old, countypop);

        growthrates.push({
            'fips': fips,
            'growthrate': county_growthrate,
            'growthdiff': county_growthdiff
        });

    }
    covid19_data_pop = mergeById(us_counties.features, covid19_data);

    covid19_counties_growth = mergeByIdGrowth(covid19_data_pop, growthrates);
})();

window.addEventListener("load", function () {
    geojson = L.geoJson(covid19_counties_growth, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);
    stateslayer.addTo(map);
});

(function ($) {
    jQuery(document).ready(function () {

        Panel.init();
        $(document).on('click', '.tab-controller', function () {
            Panel.togglePanel();
        });
        $(document).on('click', '.tab-text', function () {
            Panel.togglePanel();
        });

        $(document).on('mouseenter', '.panel-content-div p', function () {
            $("#catdescription").html($(this).find(".description").html());
        });

        function setDocHeight() {
            document.documentElement.style.setProperty('--vh', `${window.innerHeight/100}px`);
        }

        addEventListener('resize', setDocHeight);
        addEventListener('orientationchange', setDocHeight);
        setDocHeight();
    });

    var Panel = {
        isVisible: false,
        showMessage: null,
        hideMessage: null,
        animationDuration: 650,
        animationEasing: 'linear',

        init: function () {
            $('.panel-wrapper').css({
                bottom: -(Panel.getAnimationOffset())
            });
        },

        hidePanel: function () {
            $('.panel-wrapper').animate({
                bottom: -(Panel.getAnimationOffset())
            }, Panel.animationDuration, Panel.animationEasing, function () {
                Panel.isVisible = false;
                Panel.updateTabMessage();
            });
        },

        showPanel: function () {
            $('.panel-wrapper').animate({
                bottom: 0
            }, Panel.animationDuration, Panel.animationEasing, function () {
                Panel.isVisible = true;
                Panel.updateTabMessage();
            });
        },

        togglePanel: function () {
            ((this.isVisible) ? this.hidePanel : this.showPanel)();
        },

        updateTabMessage: function () {
            if (this.isVisible) {
                $('.tab-controller .close').show();
                $('.tab-controller .show').hide();
            } else {
                $('.tab-controller .close').hide();
                $('.tab-controller .show').show();
            }
        },

        getAnimationOffset: function () {
            return $('.panel-content').height();
        }
    };

})(jQuery);

