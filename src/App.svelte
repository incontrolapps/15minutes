<script>
  import * as turf from './turf_min'
  import centroids from './centroids.js'
  import { GooglePlacesAutocomplete } from 'svelte-googlemaps/svelte-googlemaps'
  import Card from './Card.svelte'
  import { setContext } from 'svelte'
  import { key } from './mapboxgl.js'

  let oas = centroids.map((e) => [e[1], e[2]])
  let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  let map
  let circleSize = 20
  let coordsCollection

  //demo settings
  if(localStorage.coordsCollection)coordsCollection=JSON.parse(localStorage.coordsCollection)

  else{
    coordsCollection = [
  [
    -0.052178113760618205,
    51.55820993223473,
    'Thistlewaite Rd, Lower Clapton, London E5 0QG',
    turf.point([-0.052178113760618205,
    51.55820993223473])
  ],
  [
    -1.5181064112668745,
    50.91500655220623,
    'Swallow Close, Totton, Southampton',
    turf.point([-1.5181064112668745,
    50.91500655220623])
  ]
]
localStorage.coordsCollection=JSON.stringify(coordsCollection)
}

  //THIS BIT FINDS OAs
  var points = turf.points(oas)
  points.features.forEach((e, i) => (e.properties.AREACD = centroids[i][0]))
  setContext(key, {
    getMap: () => map,
  })


  let updateCollection = (point) => {
    coordsCollection.push([
      point.detail.place.geometry.location.lng(),
      point.detail.place.geometry.location.lat(),
      point.detail.place.formatted_address,
      turf.point([point.detail.place.geometry.location.lng(),
      point.detail.place.geometry.location.lat()])
    ])
    coordsCollection = JSON.parse(JSON.stringify(coordsCollection))
    localStorage.coordsCollection=JSON.stringify(coordsCollection)
  }


</script>


<GooglePlacesAutocomplete
  on:placeChanged={(e) => updateCollection(e)}
  apiKey="AIzaSyCFNgMdG__MH5xwCSeMuA1xSrae-urczmg"
  disabled="false" />

<div class="wrapper">
  {#if coordsCollection}
    {#each coordsCollection as chrone, i}
      <Card {coordsCollection} {circleSize} {letters} index={i} {points} />
    {/each}
  {/if}
</div>


<style>
  :global(.mapboxgl-control-container) {
    display: none;
  }
  :global(.mapboxgl-canvas) {
    border-radius: 30px;
  }
</style>