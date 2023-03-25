import mapboxgl from 'mapbox-gl';

// https://docs.mapbox.com/help/glossary/access-token/
mapboxgl.accessToken = 'pk.eyJ1IjoidGlta2VyIiwiYSI6ImNrM3BzbGt2cjA1eW8za3VtZ2tnYTFiMm4ifQ.x4FFoK9MB7liTJFHyAZCZw';

const key = Symbol();

export { mapboxgl, key };