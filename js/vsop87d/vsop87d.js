define([
	"date-functions",
	"vsop87d/planets/earth",
	"vsop87d/planets/jupiter",
	"vsop87d/planets/mars",
	"vsop87d/planets/mecury",
	"vsop87d/planets/neptune",
	"vsop87d/planets/saturn",
	"vsop87d/planets/uranus",
	"vsop87d/planets/venus"], 

function(dateFunctions, earth, jupiter, mars, mecury, neptune, saturn, uranus, venus) {
	
	var vsop = {};
	
	/*
	 * An enumeration naming planets of the Solar system provided for convinience.
	 * Planets are indexed from 0 to 7 based on their poistion from the Sun, i.e. Mercury, being the closest to the Sun is
	 * indexed at 0, Neptune, being the furthest, is indexed at 7.
	 */
	vsop.planets = {
	    MERCURY: 	0,                // Mercury
	    VENUS: 		1,                // Venus
	    MARS: 		2,                // Mars
	    EARTH: 		3,                // Earth
	    JUPITER: 	4,                // Jupiter
	    SATURN: 	5,                // Saturn
	    URANUS: 	6,                // Uranus
	    NEPTUNE: 	7                 // Neptune
	};
	
	var TOTAL_ARGUMENTS = 12;      		  // total amount of phases and frequencies
	var TOTAL_MULTIPLIERS = 11;
	var TOTAL_COEFFICIENTS = 5;           // total amount of terms in each terms matrix

	/*
	 * 12 phases (λ⁰) of the 12 components of the arguments (φ) of sine and cosine one of the VSOP87 serie expression
	 * measured in radians.
	 */
	var phases = [
		4.40260884240,
		3.17614669689,
		1.75347045953,
		6.20347611291,
		0.59954649739,
		0.87401675650,
		5.48129387159,
		5.31188628676,
		5.19846674103,
		1.62790523337,
		2.35555589827,
		3.81034454697
	];

	/* 
	 * 12 frequencies (N) of the 12 components of the arguments (φ) of sine and cosine for one of the VSOP87 serie
	 * expression measured in radians per Julian millenia.
	 */
	var frequencies = [
		26087.9031415742,
		10213.2855462110,
		6283.0758499914,
		3340.6124266998,
		529.6909650946,
		213.2990954380,
		74.7815985673,
		38.1330356378,
		77713.7714681205,
		84334.6615813083,
		83286.9142695536,
		83997.0911355954
	];

	/*
	 * An enumeration indexing coefficients of the VSOP theiry series.
	 */
	var S = 0,                      // indices of coefficients of serie Ssinφ + Kcosφ
	    K = 1,
	    A = 2,                          // indices if coefficients of serie Acos(B + Ct)
	    B = 3,
	    C = 4;
	
	
	/*
	 * Computes a VSOP87 serie
	 *
	 *                                          Ssinφ + Kcosφ
	 *
	 * where ϕ is defined by
	 *
	 *                                      φ = Σ aᵢλᵢ, i = 1..12
	 *
	 * given the time instant (t) expressed in Julian millenia sinse the beginning of the epoch J2000, parameters aᵢ
	 * (multipliers) and coefficients S and K (coefficients) conforming to the adopted indexing of the data arrays. Last
	 * argument specifies the size of the serie.
	 *
	 * Source: P. Bretagnon and G. Francou. Planetary theories in rectangular and spherical variables. VSOP87 solutions.
	 *         Astronomy and Astrophysics, vol. 202, p. 310, exp. 2.
	 */
	var compute_serie_a = function(t, multipliers, coefficients, n) {
	    var i, j,                   // loop index variables
			lambda;              // term variable for φ serie (λ)
			phi;                 // accumulative variable for serie argument
			sum;                 // result accumulative variable

	    // computing serie Σ(Ssinφ + Kcosφ), where φ = Σ aᵢλᵢ
	    for (i = 0, sum = 0.0; i < n; i++) {
	        // computing argument φ = Σ aᵢλᵢ, i = 1..12
	        for (j = 0, phi = 0.0; j < TOTAL_ARGUMENTS; j++){
	            // computing current term of the argument λ = λ⁰ + Nt
	            lambda = phases[j] + frequencies[j] * t;
	            // accumulating argument of the serie
	            phi += multipliers[i * TOTAL_MULTIPLIERS + j] * lambda;
	        }
	        // accumulating serie sum
	        sum += coefficients[i * TOTAL_COEFFICIENTS + S] * Math.sin(phi) + coefficients[i * TOTAL_COEFFICIENTS + K] * Math.cos(phi);
	    }

	    return sum;
	}

	/*
	 * Computes a VSOP87 serie given by an expression
	 *
	 *                                          Acos(B + Ct)
	 *
	 * given the time instant (t) expressed in Julian millenia sinse the beginning of the epoch J2000 and coefficients A, B
	 * and C (coefficients) conforming to the adopted indexing of the data arrays. Last argument specifies the size of a
	 * serie.
	 *
	 * Source: P. Bretagnon and G. Francou. Planetary theories in rectangular and spherical variables. VSOP87 solutions.
	 *         Astronomy and Astrophysics, vol. 202, p. 310, exp. 2.
	 */
	var compute_serie_b = function(t, coefficients, n) {
	    var i,                      // loop index variable
			sum;                 	// result accumulative variable

	    // computing serie Σ(Acos(B + Ct))
	    for (i = 0, sum = 0.0; i < n; i++)
	        // accumulating serie sum
	        sum += coefficients[i * TOTAL_COEFFICIENTS + A] * Math.cos(coefficients[i * TOTAL_COEFFICIENTS + B] +
	                                                              coefficients[i * TOTAL_COEFFICIENTS + C] * t);

	    return sum;
	}
	
	/*
	 * vsop87b.h
	 * Created by Serhii Tsyba (sertsy@gmail.com) on 07.06.10.
	 *
	 * This file provides a routine to compute heliocentric position of a major planet of the Solar System according to the
	 * planetary theory VSOP87 version D.
	 *
	 * Position of a planet is computed in spherical (ecliptic) coordinates reckoned to the mean dynamical ecliptic and
	 * equinox of date.
	 *
	 * Abovementioned function takes two arguments. One is a time instant measured in Julian millenia since the beginning
	 * of the epoch J2000 and it can be found using the following expression
	 *
	 *                                      t = (JD - 2451545.0) / 365250
	 *
	 * where
	 *     JD          is the Julian day number of the time instant when planet's position is to be computed;
	 *     2451545.0   is the Julian day number of the beginning of the epoch J2000;
	 *     365250      is the amount of days in one Julian millenium;
	 *
	 * THe second argument is a planet for which computations are to be performed. Planets are indexed from 0 to 7
	 * according to their position from Sun, for Mercury being 0 and Neptune being 7. Provided enumeration Planet is
	 * advised to be used instead of integers for convinience.
	 *
	 * Output value is measured in radians for longitude and latitude and astronomical units (AU) for radial distance.
	 *
	 * Accuracy of the semi-analytic theory VSOP87 is about one second of arc for the time span over 6000 years before and
	 * after J2000 [2, p. 311].
	 *
	 * For more information on the theory VSOP87, refer to the following papers:
	 *      1) P. Bretagnon. Théorie du mouvement de l'ensemble des planètes VSOP82, Astronomy and Astrophysics, vol. 114,
	 *         1982, pp. 278-288.
	 *      2) P. Bretagnon and G. Francou. Planetary theories in rectangular and spherical variables. VSOP87 solutions.
	 *         Astronomy and Astrophysics, vol. 202, 1988, pp 309-315.
	 */
	vsop.heliocentric_planetary_position = function(dateObj, planet) {
		
		var JD = dateFunctions.Date2Julian(dateObj),
			t  = (JD - 2451545.0) / 365250;
		
	    var sp = {};         // result heliocentric planetary position

	    // computing each of the spherical coordinates for a given planet by adding together corresponding VSOP87 series
	    // with a proper power of t

	    switch (planet) {
	        // computing series for Mercury
	        case vsop.planets.MERCURY:
	            sp.longitude = compute_serie_b(t, mecury.mecury_longitude_0_terms, mecury.TOTAL_MERCURY_LONGITUDE_0_TERMS) +
	            compute_serie_b(t, mecury.mecury_longitude_1_terms, mecury.TOTAL_MERCURY_LONGITUDE_1_TERMS) * t +
	            compute_serie_b(t, mecury.mecury_longitude_2_terms, mecury.TOTAL_MERCURY_LONGITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, mecury.mecury_longitude_3_terms, mecury.TOTAL_MERCURY_LONGITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, mecury.mecury_longitude_4_terms, mecury.TOTAL_MERCURY_LONGITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, mecury.mecury_longitude_5_terms, mecury.TOTAL_MERCURY_LONGITUDE_5_TERMS) * t * t * t * t * t;

	            sp.latitude = compute_serie_b(t, mecury.mecury_latitude_0_terms, mecury.TOTAL_MERCURY_LATITUDE_0_TERMS) +
	            compute_serie_b(t, mecury.mecury_latitude_1_terms, mecury.TOTAL_MERCURY_LATITUDE_1_TERMS) * t +
	            compute_serie_b(t, mecury.mecury_latitude_2_terms, mecury.TOTAL_MERCURY_LATITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, mecury.mecury_latitude_3_terms, mecury.TOTAL_MERCURY_LATITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, mecury.mecury_latitude_4_terms, mecury.TOTAL_MERCURY_LATITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, mecury.mecury_latitude_5_terms, mecury.TOTAL_MERCURY_LATITUDE_5_TERMS) * t * t * t * t * t;

	            sp.distance = compute_serie_b(t, mecury.mecury_distance_0_terms, mecury.TOTAL_MERCURY_DISTANCE_0_TERMS) + 
	            compute_serie_b(t, mecury.mecury_distance_1_terms, mecury.TOTAL_MERCURY_DISTANCE_1_TERMS) * t + 
	            compute_serie_b(t, mecury.mecury_distance_2_terms, mecury.TOTAL_MERCURY_DISTANCE_2_TERMS) * t * t + 
	            compute_serie_b(t, mecury.mecury_distance_3_terms, mecury.TOTAL_MERCURY_DISTANCE_3_TERMS) * t * t * t + 
	            compute_serie_b(t, mecury.mecury_distance_4_terms, mecury.TOTAL_MERCURY_DISTANCE_4_TERMS) * t * t * t * t + 
	            compute_serie_b(t, mecury.mecury_distance_5_terms, mecury.TOTAL_MERCURY_DISTANCE_5_TERMS) * t * t * t * t * t; 
	            break;

	        // computing series for Venus
	        case vsop.planets.VENUS:
	            sp.longitude = compute_serie_b(t, venus.venus_longitude_0_terms, venus.TOTAL_VENUS_LONGITUDE_0_TERMS) +
	            compute_serie_b(t, venus.venus_longitude_1_terms, venus.TOTAL_VENUS_LONGITUDE_1_TERMS) * t +
	            compute_serie_b(t, venus.venus_longitude_2_terms, venus.TOTAL_VENUS_LONGITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, venus.venus_longitude_3_terms, venus.TOTAL_VENUS_LONGITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, venus.venus_longitude_4_terms, venus.TOTAL_VENUS_LONGITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, venus.venus_longitude_5_terms, venus.TOTAL_VENUS_LONGITUDE_5_TERMS) * t * t * t * t * t;

	            sp.latitude = compute_serie_b(t, venus.venus_latitude_0_terms, venus.TOTAL_VENUS_LATITUDE_0_TERMS) +
	            compute_serie_b(t, venus.venus_latitude_1_terms, venus.TOTAL_VENUS_LATITUDE_1_TERMS) * t +
	            compute_serie_b(t, venus.venus_latitude_2_terms, venus.TOTAL_VENUS_LATITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, venus.venus_latitude_3_terms, venus.TOTAL_VENUS_LATITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, venus.venus_latitude_4_terms, venus.TOTAL_VENUS_LATITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, venus.venus_latitude_5_terms, venus.TOTAL_VENUS_LATITUDE_5_TERMS) * t * t * t * t * t;

	            sp.distance = compute_serie_b(t, venus.venus_distance_0_terms, venus.TOTAL_VENUS_DISTANCE_0_TERMS) + 
	            compute_serie_b(t, venus.venus_distance_1_terms, venus.TOTAL_VENUS_DISTANCE_1_TERMS) * t + 
	            compute_serie_b(t, venus.venus_distance_2_terms, venus.TOTAL_VENUS_DISTANCE_2_TERMS) * t * t + 
	            compute_serie_b(t, venus.venus_distance_3_terms, venus.TOTAL_VENUS_DISTANCE_3_TERMS) * t * t * t + 
	            compute_serie_b(t, venus.venus_distance_4_terms, venus.TOTAL_VENUS_DISTANCE_4_TERMS) * t * t * t * t + 
	            compute_serie_b(t, venus.venus_distance_5_terms, venus.TOTAL_VENUS_DISTANCE_5_TERMS) * t * t * t * t * t; 
	            break;

	        // computing series for Mars
	        case vsop.planets.MARS:
	            sp.longitude = compute_serie_b(t, mars.mars_longitude_0_terms, mars.TOTAL_MARS_LONGITUDE_0_TERMS) +
	            compute_serie_b(t, mars.mars_longitude_1_terms, mars.TOTAL_MARS_LONGITUDE_1_TERMS) * t +
	            compute_serie_b(t, mars.mars_longitude_2_terms, mars.TOTAL_MARS_LONGITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, mars.mars_longitude_3_terms, mars.TOTAL_MARS_LONGITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, mars.mars_longitude_4_terms, mars.TOTAL_MARS_LONGITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, mars.mars_longitude_5_terms, mars.TOTAL_MARS_LONGITUDE_5_TERMS) * t * t * t * t * t;

	            sp.latitude = compute_serie_b(t, mars.mars_latitude_0_terms, mars.TOTAL_MARS_LATITUDE_0_TERMS) +
	            compute_serie_b(t, mars.mars_latitude_1_terms, mars.TOTAL_MARS_LATITUDE_1_TERMS) * t +
	            compute_serie_b(t, mars.mars_latitude_2_terms, mars.TOTAL_MARS_LATITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, mars.mars_latitude_3_terms, mars.TOTAL_MARS_LATITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, mars.mars_latitude_4_terms, mars.TOTAL_MARS_LATITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, mars.mars_latitude_5_terms, mars.TOTAL_MARS_LATITUDE_5_TERMS) * t * t * t * t * t;

	            sp.distance = compute_serie_b(t, mars.mars_distance_0_terms, mars.TOTAL_MARS_DISTANCE_0_TERMS) + 
	            compute_serie_b(t, mars.mars_distance_1_terms, mars.TOTAL_MARS_DISTANCE_1_TERMS) * t + 
	            compute_serie_b(t, mars.mars_distance_2_terms, mars.TOTAL_MARS_DISTANCE_2_TERMS) * t * t + 
	            compute_serie_b(t, mars.mars_distance_3_terms, mars.TOTAL_MARS_DISTANCE_3_TERMS) * t * t * t + 
	            compute_serie_b(t, mars.mars_distance_4_terms, mars.TOTAL_MARS_DISTANCE_4_TERMS) * t * t * t * t + 
	            compute_serie_b(t, mars.mars_distance_5_terms, mars.TOTAL_MARS_DISTANCE_5_TERMS) * t * t * t * t * t; 
	            break;

	        // computing series for Earth
	        case vsop.planets.EARTH:
	            sp.longitude = compute_serie_b(t, earth.earth_longitude_0_terms, earth.TOTAL_EARTH_LONGITUDE_0_TERMS) +
	            compute_serie_b(t, earth.earth_longitude_1_terms, earth.TOTAL_EARTH_LONGITUDE_1_TERMS) * t +
	            compute_serie_b(t, earth.earth_longitude_2_terms, earth.TOTAL_EARTH_LONGITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, earth.earth_longitude_3_terms, earth.TOTAL_EARTH_LONGITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, earth.earth_longitude_4_terms, earth.TOTAL_EARTH_LONGITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, earth.earth_longitude_5_terms, earth.TOTAL_EARTH_LONGITUDE_5_TERMS) * t * t * t * t * t;

	            sp.latitude = compute_serie_b(t, earth.earth_latitude_0_terms, earth.TOTAL_EARTH_LATITUDE_0_TERMS) +
	            compute_serie_b(t, earth.earth_latitude_1_terms, earth.TOTAL_EARTH_LATITUDE_1_TERMS) * t +
	            compute_serie_b(t, earth.earth_latitude_2_terms, earth.TOTAL_EARTH_LATITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, earth.earth_latitude_3_terms, earth.TOTAL_EARTH_LATITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, earth.earth_latitude_4_terms, earth.TOTAL_EARTH_LATITUDE_4_TERMS) * t * t * t * t;

	            sp.distance = compute_serie_b(t, earth.earth_distance_0_terms, earth.TOTAL_EARTH_DISTANCE_0_TERMS) + 
	            compute_serie_b(t, earth.earth_distance_1_terms, earth.TOTAL_EARTH_DISTANCE_1_TERMS) * t + 
	            compute_serie_b(t, earth.earth_distance_2_terms, earth.TOTAL_EARTH_DISTANCE_2_TERMS) * t * t + 
	            compute_serie_b(t, earth.earth_distance_3_terms, earth.TOTAL_EARTH_DISTANCE_3_TERMS) * t * t * t + 
	            compute_serie_b(t, earth.earth_distance_4_terms, earth.TOTAL_EARTH_DISTANCE_4_TERMS) * t * t * t * t + 
	            compute_serie_b(t, earth.earth_distance_5_terms, earth.TOTAL_EARTH_DISTANCE_5_TERMS) * t * t * t * t * t; 
	            break;

	        // computing series for Jupiter
	        case vsop.planets.JUPITER:
	            sp.longitude = compute_serie_b(t, jupiter.jupiter_longitude_0_terms, jupiter.TOTAL_JUPITER_LONGITUDE_0_TERMS) +
	            compute_serie_b(t, jupiter.jupiter_longitude_1_terms, jupiter.TOTAL_JUPITER_LONGITUDE_1_TERMS) * t +
	            compute_serie_b(t, jupiter.jupiter_longitude_2_terms, jupiter.TOTAL_JUPITER_LONGITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, jupiter.jupiter_longitude_3_terms, jupiter.TOTAL_JUPITER_LONGITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, jupiter.jupiter_longitude_4_terms, jupiter.TOTAL_JUPITER_LONGITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, jupiter.jupiter_longitude_5_terms, jupiter.TOTAL_JUPITER_LONGITUDE_5_TERMS) * t * t * t * t * t;

	            sp.latitude = compute_serie_b(t, jupiter.jupiter_latitude_0_terms, jupiter.TOTAL_JUPITER_LATITUDE_0_TERMS) +
	            compute_serie_b(t, jupiter.jupiter_latitude_1_terms, jupiter.TOTAL_JUPITER_LATITUDE_1_TERMS) * t +
	            compute_serie_b(t, jupiter.jupiter_latitude_2_terms, jupiter.TOTAL_JUPITER_LATITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, jupiter.jupiter_latitude_3_terms, jupiter.TOTAL_JUPITER_LATITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, jupiter.jupiter_latitude_4_terms, jupiter.TOTAL_JUPITER_LATITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, jupiter.jupiter_latitude_5_terms, jupiter.TOTAL_JUPITER_LATITUDE_5_TERMS) * t * t * t * t * t;

	            sp.distance = compute_serie_b(t, jupiter.jupiter_distance_0_terms, jupiter.TOTAL_JUPITER_DISTANCE_0_TERMS) + 
	            compute_serie_b(t, jupiter.jupiter_distance_1_terms, jupiter.TOTAL_JUPITER_DISTANCE_1_TERMS) * t + 
	            compute_serie_b(t, jupiter.jupiter_distance_2_terms, jupiter.TOTAL_JUPITER_DISTANCE_2_TERMS) * t * t + 
	            compute_serie_b(t, jupiter.jupiter_distance_3_terms, jupiter.TOTAL_JUPITER_DISTANCE_3_TERMS) * t * t * t + 
	            compute_serie_b(t, jupiter.jupiter_distance_4_terms, jupiter.TOTAL_JUPITER_DISTANCE_4_TERMS) * t * t * t * t + 
	            compute_serie_b(t, jupiter.jupiter_distance_5_terms, jupiter.TOTAL_JUPITER_DISTANCE_5_TERMS) * t * t * t * t * t; 
	            break;

	        // computing series for Saturn
	        case vsop.planets.SATURN:
	            sp.longitude = compute_serie_b(t, saturn.saturn_longitude_0_terms, saturn.TOTAL_SATURN_LONGITUDE_0_TERMS) +
	            compute_serie_b(t, saturn.saturn_longitude_1_terms, saturn.TOTAL_SATURN_LONGITUDE_1_TERMS) * t +
	            compute_serie_b(t, saturn.saturn_longitude_2_terms, saturn.TOTAL_SATURN_LONGITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, saturn.saturn_longitude_3_terms, saturn.TOTAL_SATURN_LONGITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, saturn.saturn_longitude_4_terms, saturn.TOTAL_SATURN_LONGITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, saturn.saturn_longitude_5_terms, saturn.TOTAL_SATURN_LONGITUDE_5_TERMS) * t * t * t * t * t;

	            sp.latitude = compute_serie_b(t, saturn.saturn_latitude_0_terms, saturn.TOTAL_SATURN_LATITUDE_0_TERMS) +
	            compute_serie_b(t, saturn.saturn_latitude_1_terms, saturn.TOTAL_SATURN_LATITUDE_1_TERMS) * t +
	            compute_serie_b(t, saturn.saturn_latitude_2_terms, saturn.TOTAL_SATURN_LATITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, saturn.saturn_latitude_3_terms, saturn.TOTAL_SATURN_LATITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, saturn.saturn_latitude_4_terms, saturn.TOTAL_SATURN_LATITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, saturn.saturn_latitude_5_terms, saturn.TOTAL_SATURN_LATITUDE_5_TERMS) * t * t * t * t * t;

	            sp.distance = compute_serie_b(t, saturn.saturn_distance_0_terms, saturn.TOTAL_SATURN_DISTANCE_0_TERMS) + 
	            compute_serie_b(t, saturn.saturn_distance_1_terms, saturn.TOTAL_SATURN_DISTANCE_1_TERMS) * t + 
	            compute_serie_b(t, saturn.saturn_distance_2_terms, saturn.TOTAL_SATURN_DISTANCE_2_TERMS) * t * t + 
	            compute_serie_b(t, saturn.saturn_distance_3_terms, saturn.TOTAL_SATURN_DISTANCE_3_TERMS) * t * t * t + 
	            compute_serie_b(t, saturn.saturn_distance_4_terms, saturn.TOTAL_SATURN_DISTANCE_4_TERMS) * t * t * t * t + 
	            compute_serie_b(t, saturn.saturn_distance_5_terms, saturn.TOTAL_SATURN_DISTANCE_5_TERMS) * t * t * t * t * t; 
	            break;

	        // computing series for Uranus
	        case vsop.planets.URANUS:
	            sp.longitude = compute_serie_b(t, uranus.uranus_longitude_0_terms, uranus.TOTAL_URANUS_LONGITUDE_0_TERMS) +
	            compute_serie_b(t, uranus.uranus_longitude_1_terms, uranus.TOTAL_URANUS_LONGITUDE_1_TERMS) * t +
	            compute_serie_b(t, uranus.uranus_longitude_2_terms, uranus.TOTAL_URANUS_LONGITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, uranus.uranus_longitude_3_terms, uranus.TOTAL_URANUS_LONGITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, uranus.uranus_longitude_4_terms, uranus.TOTAL_URANUS_LONGITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, uranus.uranus_longitude_5_terms, uranus.TOTAL_URANUS_LONGITUDE_5_TERMS) * t * t * t * t * t;

	            sp.latitude = compute_serie_b(t, uranus.uranus_latitude_0_terms, uranus.TOTAL_URANUS_LATITUDE_0_TERMS) +
	            compute_serie_b(t, uranus.uranus_latitude_1_terms, uranus.TOTAL_URANUS_LATITUDE_1_TERMS) * t +
	            compute_serie_b(t, uranus.uranus_latitude_2_terms, uranus.TOTAL_URANUS_LATITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, uranus.uranus_latitude_3_terms, uranus.TOTAL_URANUS_LATITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, uranus.uranus_latitude_4_terms, uranus.TOTAL_URANUS_LATITUDE_4_TERMS) * t * t * t * t;

	            sp.distance = compute_serie_b(t, uranus.uranus_distance_0_terms, uranus.TOTAL_URANUS_DISTANCE_0_TERMS) + 
	            compute_serie_b(t, uranus.uranus_distance_1_terms, uranus.TOTAL_URANUS_DISTANCE_1_TERMS) * t + 
	            compute_serie_b(t, uranus.uranus_distance_2_terms, uranus.TOTAL_URANUS_DISTANCE_2_TERMS) * t * t + 
	            compute_serie_b(t, uranus.uranus_distance_3_terms, uranus.TOTAL_URANUS_DISTANCE_3_TERMS) * t * t * t + 
	            compute_serie_b(t, uranus.uranus_distance_4_terms, uranus.TOTAL_URANUS_DISTANCE_4_TERMS) * t * t * t * t; 
	            break;

	        // computing series for Neptune
	        case vsop.planets.NEPTUNE:
	            sp.longitude = compute_serie_b(t, neptune.neptune_longitude_0_terms, neptune.TOTAL_NEPTUNE_LONGITUDE_0_TERMS) +
	            compute_serie_b(t, neptune.naptune_longitude_1_terms, neptune.TOTAL_NEPTUNE_LONGITUDE_1_TERMS) * t +
	            compute_serie_b(t, neptune.naptune_longitude_2_terms, neptune.TOTAL_NEPTUNE_LONGITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, neptune.naptune_longitude_3_terms, neptune.TOTAL_NEPTUNE_LONGITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, neptune.naptune_longitude_4_terms, neptune.TOTAL_NEPTUNE_LONGITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, neptune.naptune_longitude_5_terms, neptune.TOTAL_NEPTUNE_LONGITUDE_5_TERMS) * t * t * t * t * t;

	            sp.latitude = compute_serie_b(t, neptune.naptune_latitude_0_terms, neptune.TOTAL_NEPTUNE_LATITUDE_0_TERMS) +
	            compute_serie_b(t, neptune.naptune_latitude_1_terms, neptune.TOTAL_NEPTUNE_LATITUDE_1_TERMS) * t +
	            compute_serie_b(t, neptune.naptune_latitude_2_terms, neptune.TOTAL_NEPTUNE_LATITUDE_2_TERMS) * t * t +
	            compute_serie_b(t, neptune.naptune_latitude_3_terms, neptune.TOTAL_NEPTUNE_LATITUDE_3_TERMS) * t * t * t +
	            compute_serie_b(t, neptune.naptune_latitude_4_terms, neptune.TOTAL_NEPTUNE_LATITUDE_4_TERMS) * t * t * t * t +
	            compute_serie_b(t, neptune.naptune_latitude_5_terms, neptune.TOTAL_NEPTUNE_LATITUDE_5_TERMS) * t * t * t * t * t;

	            sp.distance = compute_serie_b(t, neptune.naptune_distance_0_terms, neptune.TOTAL_NEPTUNE_DISTANCE_0_TERMS) + 
	            compute_serie_b(t, neptune.naptune_distance_1_terms, neptune.TOTAL_NEPTUNE_DISTANCE_1_TERMS) * t + 
	            compute_serie_b(t, neptune.naptune_distance_2_terms, neptune.TOTAL_NEPTUNE_DISTANCE_2_TERMS) * t * t + 
	            compute_serie_b(t, neptune.naptune_distance_3_terms, neptune.TOTAL_NEPTUNE_DISTANCE_3_TERMS) * t * t * t + 
	            compute_serie_b(t, neptune.naptune_distance_4_terms, neptune.TOTAL_NEPTUNE_DISTANCE_4_TERMS) * t * t * t * t;
	            break;
	    }
	
		// http://astro.uchicago.edu/cosmus/tech/latlong.html 
	    var p = {
		    	x: -sp.distance * Math.cos(sp.latitude) * Math.cos(sp.longitude),
		    	y: sp.distance  * Math.sin(sp.latitude),
		    	z: sp.distance  * Math.cos(sp.latitude) * Math.sin(sp.longitude)	
			};

	    return {sp: sp, p: p};
	}
	
	return vsop;
	
});