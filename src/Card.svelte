<script>
  import * as turf from './turf_min'
  import Walking from './walking.svelte'
  import Driving from './driving.svelte'
  import Rail from './rail.svelte'
  import Bus from './busStop.svelte'
  import { mapboxgl, key } from './mapboxgl.js'
  import Circle from './circle.svelte'
  import nomis_datasets from './nomis_datasets'
  import OA2LSOA from './OA2LSOA'
  import public_trsansport from './public_transport'
  import lookup from './lookup'
 //import bus_stops from './bus_stops'
//bus_stops.forEach(e=>
//lookup[Math.round(e[0])+"_"+Math.round(e[1])]?
   // lookup[Math.round(e[0])+"_"+Math.round(e[1])].push(e):
 //   e
//)

 //console.log("stops",bus_stops)
 console.log("lookup",lookup)
  export let coordsCollection, circleSize, letters, index, points
  let eliminated = [
    'TS007',
    'TS009',
    'TS010',
    'TS012',
    'TS013',
    'TS024',
    'TS028',
    'TS032',
    'TS033',
    'TS034',
    'TS035',
    'TS036',
    'TS060',
    'TS077',
    'TS078',
    'TS047',
    'TS048',
    'TS079',
    'TS070',
    'TS071',
    'TS072',
    'TS073',
    'TS064',
    'TS074',
    'TS037ASP',
    'TS038ASP',
    'TS039ASP',
    'TS022',
    'TS031',
    'TS076',
  ]

  let nomis = nomis_datasets.tables.filter((e) => !eliminated.includes(e.code))
  let walking, driving
  let map
  let pointsWithin
  let thisOA = turf.nearestPoint(coordsCollection[index][3],points).properties.AREACD.replace("E","E00")
  let thisLSOA = OA2LSOA[thisOA].LSOA
  let busesEtc = public_trsansport[thisLSOA]
  $: points && coordsCollection && console.log(thisOA, thisLSOA, busesEtc)


  let findOAs = (points, polygon) => turf.pointsWithinPolygon(points, polygon)


  function makeIsochrone(mode, locations, range) {
    let request = new XMLHttpRequest()

    request.open(
      'POST',
      'https://api.openrouteservice.org/v2/isochrones/' + mode,
    )

    request.setRequestHeader(
      'Accept',
      'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
    )
    request.setRequestHeader('Content-Type', 'application/json')
    request.setRequestHeader(
      'Authorization',
      '5b3ce3597851110001cf6248bdbe2be691204f18b416d6e96bd55279',
    )

    request.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (mode == 'foot-walking') {
          walking = JSON.parse(this.responseText)
          localStorage[letters[index] + '_foot-walking'] = JSON.stringify(
            walking,
          )
        }
        if (mode == 'driving-car') {
          driving = JSON.parse(this.responseText)
          localStorage[letters[index] + '_driving-car'] = JSON.stringify(
            driving,
          )
        }
      }
    }

    const body = `{"locations":${locations},"range":${range},"attributes":["total_pop","area","reachfactor"],"id":"request1","intersections":"true","interval":600,"range_type":"time","smoothing":1,"area_units":"km","units":"km"}`

    request.send(body)
  }

  if (!localStorage[letters[index] + '_foot-walking']) {
    makeIsochrone(
      'foot-walking',
      `[[${coordsCollection[index][0]},${coordsCollection[index][1]}]]`,
      '[600]',
    )
  } else {
    walking = JSON.parse(localStorage[letters[index] + '_foot-walking'])
  }

  if (!localStorage[letters[index] + '_driving-car']) {
    makeIsochrone(
      'driving-car',
      `[[${coordsCollection[index][0]},${coordsCollection[index][1]}]]`,
      '[600]',
    )
  } else {
    driving = JSON.parse(localStorage[letters[index] + '_driving-car'])
  }

      console.log("turf",turf,"coordsCollection",coordsCollection," points", points)



  function renderIsos(iso, mp) {
    if (iso && mp) {
      let nomis_data = {}
      if (!localStorage[letters[index] + '_nomis']) {
        //GRAB THE NOMIS DATA
        pointsWithin = findOAs(points, iso)

        let areas = pointsWithin.features
          .map((e) => e.properties.AREACD.replace('E', 'E00'))
          .join()
        nomis
          .map((e) => e.dataset_webname)
          .forEach((e) => {
            let nomis_query =
              'https://www.nomisweb.co.uk/api/v01/dataset/' +
              e +
              '.jsonstat.json?date=latest&geography=' +
              areas +
              '&measures=20100'
            fetch(nomis_query)
              .then((data) => data.json())
              .then((json) => {
                nomis_data[e] = json
                Object.keys(nomis_data).forEach(
                  (e) =>
                    (nomis_data[e].lookup = nomis.find(
                      (el) => el.dataset_webname == e,
                    ).nomis_cd),
                )
                /*  Object.keys(nomis_data).forEach(e=>nomis_data[e].obs.forEach(ob=>ob["value"]=ob[nomis_data[e]["lookup"]].description))
            Object.values(nomis_data).forEach(e=>e.categories=([...new Set(e.obs.map(el=>el.value))]))*/
                nomis_data[e].table = []
                nomis_data[e].table.push(
                  Object.values(
                    nomis_data[e].dimension[nomis_data[e]['lookup']].category
                      .label,
                  ),
                )
                nomis_data[e].sums = []
                nomis_data[e].sums.push(
                  Object.values(
                    nomis_data[e].dimension[nomis_data[e]['lookup']].category
                      .label,
                  ),
                )

                let chunkSize = nomis_data[e].table[0].length

                if (chunkSize) {
                  for (
                    let i = 0;
                    i < nomis_data[e].value.length;
                    i += chunkSize
                  ) {
                    let chunk = nomis_data[e].value.slice(i, i + chunkSize)
                    nomis_data[e].table.push(chunk)
                  }

                  function sum(arrays) {
                    return arrays.reduce(
                      (acc, array) => acc.map((sum, i) => sum + array[i]),
                      new Array(arrays[0].length).fill(0),
                    )
                  }

                  nomis_data[e].sums.push(sum(nomis_data[e].table.slice(1)))
                }
                localStorage[letters[index] + '_nomis'] = JSON.stringify(
                  nomis_data
                )
              })
          })
      } else {
        nomis_data = JSON.parse(localStorage[letters[index] + '_nomis'])
      }

      //console.log('nomis', nomis)
      //console.log('nomis_data', nomis_data)
      mp.fitBounds([
        [iso.bbox[0] - 0.001, iso.bbox[1] - 0.001], // southwestern corner of the bounds
        [iso.bbox[2] + 0.001, iso.bbox[3] + 0.001], // northeastern corner of the bounds
      ])

      iso.features.forEach((e, i) => {
        mp.addSource('feature' + i, {
          type: 'geojson',
          data: e,
        })

        // Add a new layer to visualize the polygon.
        mp.addLayer({
          id: 'feature' + i,
          type: 'fill',
          source: 'feature' + i, // reference the data source
          layout: {},
          paint: {
            'fill-color': '#0080ff', // blue color fill
            'fill-opacity': 0.5,
          },
        })

        // Add a black outline around the polygon.
        mp.addLayer({
          id: 'outline' + i,
          type: 'line',
          source: 'feature' + i,
          layout: {},
          paint: {
            'line-color': '#000',
            'line-width': 3,
          },
        })

        //console.log('C', e.properties.center)
        // Add a circle at the centre
        mp.addSource('markers' + i, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: e.properties.center,
                },
                properties: {
                  modelId: i,
                },
              },
            ],
          },
        })

        mp.addLayer({
          id: 'circles' + i,
          source: 'markers' + i,
          type: 'circle',
          paint: {
            'circle-radius': 10,
            'circle-color': 'red',
            'circle-opacity': 1,
            'circle-stroke-width': 0,
          },
          filter: ['==', 'modelId', i],
        })
      })
    }
  }

  function initMap(container, coords) {
    console.log("coords",coords)
    map = new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [coords[0],coords[1]],
      zoom: 10,
    })
  }

  //$: map && console.log('GOT A MAP ') //; makeIsochrone(); document.querySelector('[aria-label="location"]').removeAttribute('disabled'); document.querySelector('[aria-label="location"]').setAttribute('placeholder',"Address or Post Code")})

  $: map && setTimeout(() => renderIsos(walking, map), 500)

  //console.log("1: I'm listening")

  //$: localStorage.coordsCollection=JSON.stringify(coordsCollection)
</script>

<div class="card">
  <div class="map" use:initMap={coordsCollection[index]} />
  <svg class="map" width="100%">
    <Circle
      {circleSize}
      letter={letters[index]}
      title={coordsCollection[index][2]} />
    <Walking y={circleSize * 2.2} />
    {#if walking}
      <text
        x={circleSize * 2 + 6}
        y={circleSize * 4.2}
        font-size={circleSize * 0.8}
        font-weight="normal"
        fill="black">
        <tspan class="b">
          {#if walking.features[0].properties}
            {walking.features[0].properties.total_pop.toLocaleString()}
          {/if}
        </tspan>
        people live within 15 minutes walk
      </text>
    {/if}
    {#if driving}
      <Driving y={circleSize * 4.4 + 6} />
      <text
        x={circleSize * 2 + 6}
        y={circleSize * 6.4}
        font-size={circleSize * 0.8}
        font-weight="normal"
        fill="black">
        <tspan class="b">
          {#if driving.features[0].properties}
            {driving.features[0].properties.total_pop.toLocaleString()}
          {/if}
        </tspan>
        people live within 15 minutes drive
      </text>
    {/if}
    <Rail y={circleSize * 6.6 + 6} />
    <text
      x={circleSize * 2 + 6}
      y={circleSize * 8.6}
      font-size={circleSize * 0.8}
      font-weight="normal"
      fill="black">
      <tspan class="b">{busesEtc.public_transport_travel_time} minutes</tspan>
      to {busesEtc.closest_station_name} by public transport
    </text>
    <Bus y={circleSize * 6.6 + 6} />
    <text
      x={circleSize * 2 + 6}
      y={circleSize * 10.8}
      font-size={circleSize * 0.8}
      font-weight="normal"
      fill="black">
      <tspan class="b">[x] bus stops</tspan>
      within a fifteen minute walk
    </text>
    {#if pointsWithin}
      <text
        x={circleSize * 2 + 6}
        y={circleSize * 13}
        font-size={circleSize * 0.5}
        font-weight="normal"
        fill="black">
        {pointsWithin.features
          .map((e) => e.properties.AREACD)
          .map((e) => e[0] + '00' + e.slice(1, e.length))
          .join(',')}
      </text>
    {/if}
  </svg>
</div>
