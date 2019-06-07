/* global $ */

// predeclarables
var passengerGeneratorInterval;
var stationOverloadedInterval;
var trainMovementInterval;
var rapidRedFlashInterval;
var generateStationsInterval;
var trainUnloadCycleTimeout;
var trainLoadCycleTimeout;
var passengersDelivered = 0;
var trainsAvailableTotalCount = 5;

/*					- event listeners start -					*/
$('#STOP').click(function () {
	clearInterval(passengerGeneratorInterval);
	clearInterval(stationOverloadedInterval);
	clearInterval(trainMovementInterval);
	clearInterval(rapidRedFlashInterval);
	clearInterval(generateStationsInterval);
	clearTimeout(trainUnloadCycleTimeout);
	clearTimeout(trainLoadCycleTimeout);
	console.log(' S T A P H !  S T A P H !  S T A P H ! ');
});

$('#test').click(function () {
	generateStations();
});

$('#debugToggle').click(function () {
	$('.debug').toggle();
});

$('#toggleGridNumbers').click(function () {
	$('.debugGrid').toggle();
});

var disableLoseCondition = false;
$('#toggleLoseCondition').click(function () {
	if (disableLoseCondition === false) {
		disableLoseCondition = true;
		$('#toggleLoseCondition').text('LOSE CONDITION DISABLED');
	} else if (disableLoseCondition === true) {
		disableLoseCondition = false;
		$('#toggleLoseCondition').text('LOSE CONDITION ACTIVE');
	}
});

$('#clearAllStations').click(function () {
	$.each(stationAssetsMasterObject, function (key, value) {
		value.stationPassengerList = [];
		$('#gameGridCell_' + value.stationGridLocation + ' .stationPlatform').text(value.stationPassengerList.join(' '));
	});
});

$('#clearAllTracks').click(function () {
	lineAssetsMasterObject = {};
	trainAssetsMasterObject = {};	// clear trains
	gameGridArray = [];	// clear grid logically
	$('.gameGridCell').remove();	// clear grid display
	generateGameGridArray(desiredGameGridTotalSize);	// remake grid logically
	displayLogic();	// remake grid display
	trainsAvailableTotalCount = 6;
	$('#resourceStatus').text(trainsAvailableTotalCount + ' trains available');
});

$('#unlimitedTrains').click(function () {
	trainsAvailableTotalCount = 777;
	$('#resourceStatus').text(trainsAvailableTotalCount + ' trains available');
});

function enableAllColoursBuildTrackEventListener () {
	disableOtherColoursBuildTrackEventListener();	// reset all listeners before setting again

	lineColoursArray.forEach(function (element) {
		$('#build' + element + 'Track').click(function () {
			buildTrackEventListenerLogic(element);
		});
	});
}

function disableOtherColoursBuildTrackEventListener (colourInput) {
	lineColoursArray.forEach(function (element) {
		if (element !== colourInput) {
			$('#build' + element + 'Track').off();
		}
	});
}

function buildTrackEventListenerLogic (colourInput) {
	if (lineAssetsMasterObject[colourInput + 'Line'] === undefined) {  // check if object is already made
		lineAssetsMasterObject[colourInput + 'Line'] = new Line(colourInput);
	}

	if (lineAssetsMasterObject[colourInput + 'Line'].buildTrackMode === false) {
		disableOtherColoursBuildTrackEventListener(colourInput);
		$('#build' + colourInput + 'Track').text('CONFIRM TRACK LOCATIONS');
	} else if (lineAssetsMasterObject[colourInput + 'Line'].buildTrackMode === true) {
		enableAllColoursBuildTrackEventListener();
		$('#build' + colourInput + 'Track').text('BUILD ' + colourInput.toUpperCase() + ' LINE');
		// sad hack because navy != blue
		if (colourInput === 'navy') {
			$('#build' + colourInput + 'Track').text('BUILD BLUE LINE');
		}
	}
	lineAssetsMasterObject[colourInput + 'Line'].buildTrackMethodLogic();
}

$('#removeEntireredLine').click(function () {
	removeEntireLine('red');
});
$('#removeEntirenavyLine').click(function () {
	removeEntireLine('navy');
});
$('#removeEntireorangeLine').click(function () {
	removeEntireLine('orange');
});

function removeEntireLine (colourInput) {
	// remove all colourInput trains
	$.each(trainAssetsMasterObject, function (index, value) {
		index = index.split(colourInput);
		if (index[1] > 0) {
			var removeTrainTarget = 'train' + colourInput + index[1];
			console.log('removeTrainTarget', removeTrainTarget);
			trainAssetsMasterObject[removeTrainTarget].isTrainToBeRemoved = true;  // sets flag variable
			console.log(removeTrainTarget, 'is the delete target');
		}
	});

	// ensure that all trains are gone
	if (lineAssetsMasterObject[colourInput + 'Line'].trainCount === 0) {
		// logically remove Tracks
		gameGridArray.forEach(function (element) {
			if (element[colourInput + 'trackValue'] !== undefined) {
				delete element[colourInput + 'trackValue'];
			}
		});
		// remove line object
		delete lineAssetsMasterObject[colourInput + 'Line'];

		// remove line info from stationAssetsMasterObject
		$.each(stationAssetsMasterObject, function (key, value) {
			var stationLinesArrayBuffer = stationAssetsMasterObject[key].stationLinesArray.filter(function (element) {
				// console.log('stationLineArray element is', element);
				if (element !== colourInput) {
					return true;
				}
			});
			stationAssetsMasterObject[key].stationLinesArray = stationLinesArrayBuffer;
		});

		// remove line visually
		$('.' + colourInput + 'TrainLine').remove();

		// every other line shld recheck their line
		lineColoursArray.forEach(function (element) {
			if (lineAssetsMasterObject[element + 'Line'] !== undefined) {
				lineAssetsMasterObject[element + 'Line'].buildTrackMode = true;	// to toggle part 2 of buildTrackMethodLogic
				lineAssetsMasterObject[element + 'Line'].buildTrackLogicalUpdateOnlyMode = true;
				lineAssetsMasterObject[element + 'Line'].buildTrackMethodLogic();
				console.log(element, 'line has been rechecked');
			}
		});

	} else {
		$('#resultTarget').text('Trains are still running on the line, wait for them to be removed!');
		$('#resultTarget').css({'background-color': 'maroon'});
		setTimeout(function () {
			$('#resultTarget').text('');
			$('#resultTarget').css('background-color', 'black');
		}, 4000);
	}
}

$('#newredTrain').click(function () {
	newTrainEventListenerLogic('red');
});

$('#newnavyTrain').click(function () {
	newTrainEventListenerLogic('navy');
});

$('#neworangeTrain').click(function () {
	newTrainEventListenerLogic('orange');
});

function newTrainEventListenerLogic (colourInput) {
	if (trainsAvailableTotalCount > 0) {
		lineAssetsMasterObject[colourInput+'Line'].trainCount++;
		var trainIDBuffer = colourInput + lineAssetsMasterObject[colourInput + 'Line'].trainCount;// provides trainID numbers

		trainAssetsMasterObject['train' + trainIDBuffer] = new Train(trainIDBuffer); // populate train asset master object
		trainAssetsMasterObject['train' + trainIDBuffer].trainGridLocation = lineAssetsMasterObject[colourInput + 'Line'].lineStartGridLocation;
		trainAssetsMasterObject['train' + trainIDBuffer].trainLine = colourInput;
		trainsAvailableTotalCount--;
		$('#resourceStatus').text(trainsAvailableTotalCount + ' trains available');

		// intial train display
		$('#gameGridCell_' + trainAssetsMasterObject['train' + trainIDBuffer].trainGridLocation).append('<div id="train_' + trainAssetsMasterObject['train' + trainIDBuffer].trainID + '" class="train">' + trainAssetsMasterObject['train' + trainIDBuffer].trainPassengerListArray.join(' ') + '</div>');
		$('#train_' + trainAssetsMasterObject['train' + trainIDBuffer].trainID).addClass(colourInput + 'ColouredTrain');

		// intial station check
		trainAssetsMasterObject['train' + trainIDBuffer].trainAtStationLogic();

	// console.log(trainIDBuffer);
	// console.log(trainAssetsMasterObject['train' + trainIDBuffer]);
	} else {
		$('#resultTarget').text('No more trains available!');
		$('#resultTarget').css({'background-color': 'maroon'});
		setTimeout(function () {
			$('#resultTarget').text('');
			$('#resultTarget').css('background-color', 'black');
		}, 2000);
	}
}

$('#removeredTrain').click(function () {
	removeTrainEventListenerLogic('red');
});

$('#removenavyTrain').click(function () {
	removeTrainEventListenerLogic('navy');
});

$('#removeorangeTrain').click(function () {
	removeTrainEventListenerLogic('orange');
});

function removeTrainEventListenerLogic (colourInput) {
	var removeTrainCounter = 0;
	$.each(trainAssetsMasterObject, function (index, value) {
		index = index.split(colourInput);
		if (index[1] > removeTrainCounter) {
			removeTrainCounter = index[1];
		}
	});
	var removeTrainTarget = 'train' + colourInput + removeTrainCounter;
	trainAssetsMasterObject[removeTrainTarget].isTrainToBeRemoved = true;  // sets flag variable
	console.log(removeTrainTarget, 'is the delete target');
}
/*					- event listeners end -					*/

/*					- arrays/objects start -					*/
/*					- Game grid section start -					*/
var gameGridArray = [];
var desiredGameGridTotalSize = 96;// 12x8

function generateGameGridArray (input) {
	for (var x = 1; x <= desiredGameGridTotalSize;x++) {
		gameGridArray.push({});	// push empty objects
	}
}
generateGameGridArray(desiredGameGridTotalSize);

// hardcoded game grid length, if grid is square, use square root as formula!
var gameGridLength = 12;

// generates track scanning pattern based on grid length
function trackScanningPatternGenerator (n) {
	var pattern = [-n - 1, -n, -n + 1, -1, 1, n - 1, n, n + 1];
	return pattern;
}
var trackScanningPatternArray = trackScanningPatternGenerator(gameGridLength);
/*					- Game grid section end -					*/

// array containing line colours
var lineColoursArray = ['red', 'navy', 'orange'];

// object containing all stations
var stationAssetsMasterObject = {
	'station27': {
		stationGridLocation: 27,
		stationTypePlaintext: 'circle',
		stationOverloadCounter: 0,
		stationType: '\u2B24',
		stationStatus: 'active',
		stationLinesArray: [],
		stationPassengerList: []
	},
	'station54': {
		stationGridLocation: 54,
		stationTypePlaintext: 'triangle',
		stationOverloadCounter: 0,
		stationType: '\u25B2',
		stationStatus: 'active',
		stationLinesArray: [],
	stationPassengerList: []},
	'station52': {
		stationGridLocation: 52,
		stationTypePlaintext: 'square',
		stationOverloadCounter: 0,
		stationType: '\u2B1B',
		stationStatus: 'active',
		stationLinesArray: [],
	stationPassengerList: []},
	'station11': {
		stationGridLocation: 11,
		stationTypePlaintext: 'triangle',
		stationOverloadCounter: 0,
		stationType: '\u25B2',
		stationStatus: 'hidden',
		stationLinesArray: [],
	stationPassengerList: []},
	'station0': {
		stationGridLocation: 0,
		stationTypePlaintext: 'triangle',
		stationOverloadCounter: 0,
		stationType: '\u25B2',
		stationStatus: 'hidden',
		stationLinesArray: [],
	stationPassengerList: []},
	'station44': {
		stationGridLocation: 44,
		stationTypePlaintext: 'triangle',
		stationOverloadCounter: 0,
		stationType: '\u25B2',
		stationStatus: 'hidden',
		stationLinesArray: [],
	stationPassengerList: []},
	'station84': {
		stationGridLocation: 84,
		stationTypePlaintext: 'circle',
		stationOverloadCounter: 0,
		stationType: '\u2B24',
		stationStatus: 'hidden',
		stationLinesArray: [],
	stationPassengerList: []},
	'station77': {
		stationGridLocation: 77,
		stationTypePlaintext: 'circle',
		stationOverloadCounter: 0,
		stationType: '\u2B24',
		stationStatus: 'hidden',
		stationLinesArray: [],
	stationPassengerList: []},
	'station49': {
		stationGridLocation: 49,
		stationTypePlaintext: 'circle',
		stationOverloadCounter: 0,
		stationType: '\u2B24',
		stationStatus: 'hidden',
		stationLinesArray: [],
	stationPassengerList: []},
	'station95': {
		stationGridLocation: 95,
		stationTypePlaintext: 'circle',
		stationOverloadCounter: 0,
		stationType: '\u2B24',
		stationStatus: 'hidden',
		stationLinesArray: [],
	stationPassengerList: []},
	'station30': {
		stationGridLocation: 30,
		stationTypePlaintext: 'square',
		stationOverloadCounter: 0,
		stationType: '\u2B1B',
		stationStatus: 'hidden',
		stationLinesArray: [],
	stationPassengerList: []}
};

// object containing all line objects
var lineAssetsMasterObject = {};

// object containing all train objects
var trainAssetsMasterObject = {};
/*					- arrays/objects end -					*/

/*					- Constructors start -					*/
// Train constructor object

function Line (lineID) {
	this.lineID = lineID;  // actual colour eg'red'
	this.lineStartGridLocation = undefined;
	this.stationTypesOnLineArray = [];
	this.interchangeOnLineListObject = {};
	this.trainCount = 0;
	this.buildTrackMode = false;
	this.buildTrackInitialState = true;
	this.buildTrackValue = 0;
	this.buildTrackValidGrids = [];
	this.buildTrackLogicalUpdateOnlyMode = false;
	this.buildTrackMethodLogic = function () {
		if (this.buildTrackMode === false) {
			// console.log('buildTrackMethodLogic fired');
			this.buildTrackMode = true;

			var currentGrid = 0;
			// var buildTrackValidGrids = [];
			$('body').click((function (event) {
				var eventTargetID = event.target.id;// fetches clicked ID
				eventTargetID = eventTargetID.split('_');			// split ID string by underscore
				// console.log('eventTargetID[0] is', eventTargetID[0]);
				// console.log('eventTargetID[1] is', eventTargetID[1]);

				// function to 1: set trackValue 2: display new track 3: increment buildTrackValue 4: scan and build next valid grid array
				var boundlayingOfNewTrackSOP = (function layingOfNewTrackSOP () {

					// logically set trackValue
					gameGridArray[currentGrid][this.lineID + 'trackValue'] = this.buildTrackValue;
					// display track placeholders
					$('#gameGridCell_' + currentGrid).append('<div class="trackPlaceholder">🚧&nbsp;&nbsp;&nbsp;&nbsp;🚧</div>');

					this.buildTrackValue++;

					// build valid grid array
					this.buildTrackValidGrids = [];
					trackScanningPatternArray.forEach((function (scanPatternElement) {
						var scannedGrid = currentGrid + scanPatternElement;
						this.buildTrackValidGrids.push(scannedGrid);
					}).bind(this));
					// console.log('valid grids are', buildTrackValidGrids);

				}).bind(this);

				if (eventTargetID[0] === 'gameGridCell') {		// if gameGridArray found
					// console.log('gameGridArray found');
					currentGrid = parseInt(eventTargetID[1], 10);
					// console.log('current grid is', currentGrid);

					// console.log(Object.keys(gameGridArray[currentGrid]).length);
					if (Object.keys(gameGridArray[currentGrid]).length > 0) {
						if (this.buildTrackInitialState === true) {
							this.buildTrackInitialState = false;
							boundlayingOfNewTrackSOP();
							// pass initial track to Line object
							this.lineStartGridLocation = currentGrid;
						} else {
							// console.log('buildTrackInitialState is false');

							// check if currentGrid is a valid grid
							if (this.buildTrackValidGrids.indexOf(currentGrid) !== -1) {
								boundlayingOfNewTrackSOP();
							} else {
								$('#resultTarget').text('Select a grid next to the tunnel boring machine!');
								$('#resultTarget').css({'background-color': 'maroon'});
								setTimeout(function () {
									$('#resultTarget').text('');
									$('#resultTarget').css('background-color', 'black');
								}, 4000);
							}
						}	// else buildTrackInitialState is false close
					} else if (Object.keys(gameGridArray[currentGrid]).length === 0) {
						// grid is empty
						if (this.buildTrackInitialState === true) {
							this.buildTrackInitialState = false;
							boundlayingOfNewTrackSOP();
							this.lineStartGridLocation = currentGrid;
						} else {
							if (this.buildTrackValidGrids.indexOf(currentGrid) !== -1) {
								boundlayingOfNewTrackSOP();
							} else {
								$('#resultTarget').text('Select a grid next to the tunnel boring machine!');
								$('#resultTarget').css({'background-color': 'maroon'});
								setTimeout(function () {
									$('#resultTarget').text('');
									$('#resultTarget').css('background-color', 'black');
								}, 4000);
							}
						}	// else buildTrackInitialState is false close
					}
				} else { // game grid found close
					$('#resultTarget').text('Click on grids in sequence to build tracks. Do avoid accidentally clicking on stations!');
					$('#resultTarget').css({'background-color': 'maroon'});
				}
			}).bind(this)); // body click event close
		} else {
			// console.log('stopBuildTrack fired');
			$('body').off();
			$('.trackPlaceholder').remove();
			this.buildTrackMode = false;
			$('#resultTarget').text('');
			$('#resultTarget').css('background-color', 'black');

			// console.log('what is this', this);
			// console.log('start grid is', this.lineStartGridLocation);
			var currentGridIndex = this.lineStartGridLocation;
			var currentGrid = gameGridArray[currentGridIndex];
			var reachedEndOfLine = false;
			this.stationTypesOnLineArray = [];
			this.interchangeOnLineListObject = {};
			var nextGridIndex;
			var endOfLineGridIndex;

			// visually remove existing tracks
			if (this.buildTrackLogicalUpdateOnlyMode === false) {
				$('.' + this.lineID + 'TrainLine').remove();
			}

			// function to map out stations and interchanges and display track visuals
			function buildTrackDisplay () {
				// console.log(this.lineID, 'line buildTrackDisplay running. current grid is', currentGridIndex);
				reachedEndOfLine = true;

				// this will run for every TV grid
				// check for station

				if (stationAssetsMasterObject['station' + currentGridIndex] !== undefined) {
					// console.log('valid station found at grid', currentGridIndex);

					// check if station type is new, if so, add to array
					if (this.stationTypesOnLineArray.indexOf(stationAssetsMasterObject['station' + currentGridIndex].stationType) === -1) {
						this.stationTypesOnLineArray.push(stationAssetsMasterObject['station' + currentGridIndex].stationType);
					// console.log('type added, it is', this.stationTypesOnLineArray);
					}

					// check if station is an interchange
					// check how many lines are present
					if (Object.keys(gameGridArray[currentGridIndex]).length > 1) {
						// console.log('station is an interchange');
						// console.log('gameGridArray[currentGridIndex] is', gameGridArray[currentGridIndex]);
						$.each(gameGridArray[currentGridIndex], function ( key, value ) {
							key = key.split('trackValue');
							// console.log('target colour', key[0]);
							if (lineAssetsMasterObject[key[0] + 'Line'].interchangeOnLineListObject[currentGridIndex] === undefined) {
								lineAssetsMasterObject[key[0] + 'Line'].interchangeOnLineListObject[currentGridIndex] = currentGridIndex;
							}
						// console.log('target color interchange list', lineAssetsMasterObject[key[0] + 'Line'].interchangeOnLineListObject);
						});
					}

					// input line colour into station object
					if (stationAssetsMasterObject['station' + currentGridIndex].stationLinesArray.indexOf(this.lineID) === -1) {
						stationAssetsMasterObject['station' + currentGridIndex].stationLinesArray.push(this.lineID);
					}
				}

				// scan grids and generate track display
				trackScanningPatternArray.forEach((function (scanPatternElement, index) {
					var scannedGrid = gameGridArray[currentGridIndex + scanPatternElement];
					if (typeof scannedGrid !== 'undefined') {
						if (scannedGrid[this.lineID + 'trackValue'] === currentGrid[this.lineID + 'trackValue'] + 1) {
							// console.log('valid grid found');
							// console.log('current grid index is', currentGridIndex);
							// console.log('scan index is', index);
							// console.log('scannedgrid is', scannedGrid);
							reachedEndOfLine = false;
							nextGridIndex = scanPatternElement;

							if (this.buildTrackLogicalUpdateOnlyMode === false) {
								if (index === 0) {
									// direction is NW
									$('#gameGridCell_' + currentGridIndex).prepend('<div class="trackDisplayNW ' + this.lineID + 'TrainLine"></div>');
									$('#gameGridCell_' + (currentGridIndex + scanPatternElement)).prepend('<div class="trackDisplaySE ' + this.lineID + 'TrainLine"></div>');
								}
								else if (index === 1) {
									// direction is N
									$('#gameGridCell_' + currentGridIndex).prepend('<div class="trackDisplayN ' + this.lineID + 'TrainLine"></div>');
									$('#gameGridCell_' + (currentGridIndex + scanPatternElement)).prepend('<div class="trackDisplayS ' + this.lineID + 'TrainLine"></div>');
								}
								else if (index === 2) {
									// direction is NE
									$('#gameGridCell_' + currentGridIndex).prepend('<div class="trackDisplayNE ' + this.lineID + 'TrainLine"></div>');
									$('#gameGridCell_' + (currentGridIndex + scanPatternElement)).prepend('<div class="trackDisplaySW ' + this.lineID + 'TrainLine"></div>');
								}
								else if (index === 3) {
									// direction is W
									$('#gameGridCell_' + currentGridIndex).prepend('<div class="trackDisplayW ' + this.lineID + 'TrainLine"></div>');
									$('#gameGridCell_' + (currentGridIndex + scanPatternElement)).prepend('<div class="trackDisplayE ' + this.lineID + 'TrainLine"></div>');
								}
								else if (index === 4) {
									// direction is E
									$('#gameGridCell_' + currentGridIndex).prepend('<div class="trackDisplayE ' + this.lineID + 'TrainLine"></div>');
									$('#gameGridCell_' + (currentGridIndex + scanPatternElement)).prepend('<div class="trackDisplayW ' + this.lineID + 'TrainLine"></div>');
								}
								else if (index === 5) {
									// direction is SW
									$('#gameGridCell_' + currentGridIndex).prepend('<div class="trackDisplaySW ' + this.lineID + 'TrainLine"></div>');
									$('#gameGridCell_' + (currentGridIndex + scanPatternElement)).prepend('<div class="trackDisplayNE ' + this.lineID + 'TrainLine"></div>');
								}
								else if (index === 6) {
									// direction is S
									$('#gameGridCell_' + currentGridIndex).prepend('<div class="trackDisplayS ' + this.lineID + 'TrainLine"></div>');
									$('#gameGridCell_' + (currentGridIndex + scanPatternElement)).prepend('<div class="trackDisplayN ' + this.lineID + 'TrainLine"></div>');
								}
								else if (index === 7) {
									// direction is SE
									$('#gameGridCell_' + currentGridIndex).prepend('<div class="trackDisplaySE ' + this.lineID + 'TrainLine"></div>');
									$('#gameGridCell_' + (currentGridIndex + scanPatternElement)).prepend('<div class="trackDisplayNW ' + this.lineID + 'TrainLine"></div>');
								}
							}
						}
					}

				}).bind(this));
				assignNextTrackDisplayGrids(nextGridIndex);

				function assignNextTrackDisplayGrids (inputIndex) {
					endOfLineGridIndex = currentGridIndex;
					currentGridIndex = currentGridIndex + inputIndex;
					currentGrid = gameGridArray[currentGridIndex];
				}
			}
			var boundBuildTrackDisplay = buildTrackDisplay.bind(this);
			while(reachedEndOfLine === false) boundBuildTrackDisplay();
			// colour last grid?
			$('#' + this.lineID + 'EndOfLine').remove();
			$('#gameGridCell_' + endOfLineGridIndex).append('<div id="' + this.lineID + 'EndOfLine" class="' + this.lineID + 'TrainLine"></div>');
		}
	};
}

function Train (trainID) {
	this.trainID = trainID;
	this.trainDirection = 'asc';
	this.trainCapacity = 6;
	this.trainPassengerListArray = [];
	this.isTrainFreeToMove = true;
	this.trainGridLocation = undefined;
	this.trainLine = undefined;
	this.trainMovementNextGridOrientation = undefined;
	this.trainMovementLogic = function () {
		var ascTrackGrid = this.trainGridLocation;// default is current grid so that trains can stay still
		var descTrackGrid = this.trainGridLocation;
		var ascEndOfLine = true;
		var descEndOfLine = true;
		var ascNextGridOrientation;
		var descNextGridOrientation;

		if (this.isTrainFreeToMove === true) {    // only allows movement if train is free
			// uses scanning pattern to find the asc and desc track
			// scan both directions so that you can reverse on the fly
			// if track is found, end of line is set to false
			trackScanningPatternArray.forEach((function (scanPatternElement, scanPatternIndex) {
				var currentGrid = gameGridArray[this.trainGridLocation];
				var scannedGrid = gameGridArray[this.trainGridLocation + scanPatternElement];

				if (typeof scannedGrid !== 'undefined') {
					if (scannedGrid[this.trainLine + 'trackValue'] === currentGrid[this.trainLine + 'trackValue'] + 1) {
						ascTrackGrid = this.trainGridLocation + scanPatternElement;
						ascEndOfLine = false;
						ascNextGridOrientation = scanPatternIndex;
					}
					if (scannedGrid[this.trainLine + 'trackValue'] === currentGrid[this.trainLine + 'trackValue'] - 1) {
						descTrackGrid = this.trainGridLocation + scanPatternElement;
						descEndOfLine = false;
						descNextGridOrientation = scanPatternIndex;
					}
				}
			}).bind(this));

			// reverses direction of train if end of line is detected
			if (ascEndOfLine === true) {
				this.trainDirection = 'desc';
			}	else if (descEndOfLine === true) {
				this.trainDirection = 'asc';
			}

			// train update display logic
			// train at station logic is also triggered from here

			//	remove old display,
			$('#train_' + this.trainID).remove();
			$('#gameGridCell_' + this.trainGridLocation).append('<div id="train_' + this.trainID + '" class="train ' + this.trainLine + 'ColouredTrain">' + this.trainPassengerListArray.join(' ') + '</div>');

			if (this.trainDirection === 'asc') {
				this.trainGridLocation = ascTrackGrid;
				this.trainMovementNextGridOrientation = ascNextGridOrientation;
				this.updateTrainDisplay();
				this.trainAtStationLogic();	// train must move to trigger train at station logic
			} else if (this.trainDirection === 'desc') {
				this.trainGridLocation = descTrackGrid;
				this.trainMovementNextGridOrientation = descNextGridOrientation;
				this.updateTrainDisplay();
				this.trainAtStationLogic();
			}
		}
	};
	this.updateTrainDisplay = function () {
		if (this.trainMovementNextGridOrientation === 0) {
			// NW
			$('#train_' + this.trainID).addClass('moveNW');
		}
		else if (this.trainMovementNextGridOrientation === 1) {
			// N
			$('#train_' + this.trainID).addClass('moveN');
		}
		else if (this.trainMovementNextGridOrientation === 2) {
			// NE
			$('#train_' + this.trainID).addClass('moveNE');
		}
		else if (this.trainMovementNextGridOrientation === 3) {
			// W
			$('#train_' + this.trainID).addClass('moveW');
		}
		else if (this.trainMovementNextGridOrientation === 4) {
			// E
			$('#train_' + this.trainID).addClass('moveE');
		}
		else if (this.trainMovementNextGridOrientation === 5) {
			// SW
			$('#train_' + this.trainID).addClass('moveSW');
		}
		else if (this.trainMovementNextGridOrientation === 6) {
			// S
			$('#train_' + this.trainID).addClass('moveS');
		}
		else if (this.trainMovementNextGridOrientation === 7) {
			// SE
			$('#train_' + this.trainID).addClass('moveSE');
		}
	};
	this.trainAtStationLogic = function () {
		var currentTrainGridLocation = this.trainGridLocation;

		if (stationAssetsMasterObject['station' + currentTrainGridLocation] !== undefined) {// station detected

			this.isTrainFreeToMove = false;
			var trainCapacity = this.trainCapacity;
			var trainPassengerListArray = this.trainPassengerListArray;
			var trainPassengerNumbers = trainPassengerListArray.length;
			var stationPassengerListArray = stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList;
			var stationPassengerNumbers = stationPassengerListArray.length;
			var currentGridstationType = stationAssetsMasterObject['station' + currentTrainGridLocation].stationType;
			var stationPassengersToBoardArray = {};
			var stationPassengerstoBoardNumbers;
			var stationPassengersToStayArray;

			// train unload cycle is a self recursive function limited by an if conditional
			// train takes 333ms to unload 1 passenger
			function trainUnloadCycle () {
				if (passengersToAlight.length > 0) {
					trainUnloadCycleTimeout = setTimeout((function () {
						var currentPassenger = passengersToAlight.pop();

						// if passenger does not belong to this station
						if (currentPassenger !== currentGridstationType) {
							stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList.push(currentPassenger);

							$('#gameGridCell_' + currentTrainGridLocation + ' .stationPlatform').text(stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList.join(' '));
						}

						$('#train_' + this.trainID).text(this.trainPassengerListArray.join(' ') + ' ' + passengersToAlight.join(' '));
						boundTrainUnloadCycle();
						passengersDelivered++;
						if (passengersDelivered === 1) {
							$('#scoreTarget').text('ONE VERY HAPPY COMMUTER!');
						} else {
							$('#scoreTarget').text(passengersDelivered + ' happy commuters!');
						}
					}).bind(this), 333);
				} else {
					// refresh all vars
					trainPassengerListArray = this.trainPassengerListArray;
					trainPassengerNumbers = trainPassengerListArray.length;
					stationPassengerListArray = stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList;
					stationPassengerNumbers = stationPassengerListArray.length;

					if (this.isTrainToBeRemoved === true) {
						console.log('train' + this.trainID, 'to be deleted. trainAssetsMasterObject is', trainAssetsMasterObject);
						delete trainAssetsMasterObject['train' + this.trainID];   	// logical delete
						lineAssetsMasterObject[this.trainLine+'Line'].trainCount--;
						console.log('trainAssetsMasterObject is', trainAssetsMasterObject);
						$('#train_' + this.trainID).remove();               	// visual delete
						trainsAvailableTotalCount++;
						$('#resourceStatus').text(trainsAvailableTotalCount + ' trains available');
						return;	// to prevent loadCycle from running
					}

					boundTrainLoadPrep();  // only runs load cycle once unload cycle is done
				}
			}

			// function trainLoadPrep prepares the boarding array for trainLoadCycle to cycle through
			function trainLoadPrep () {
				if (lineAssetsMasterObject[this.trainLine + 'Line'].interchangeOnLineListObject[currentTrainGridLocation] !== undefined) {
					// station is an interchange
					// console.log('interchange detected on ', this.trainLine, ' line while loading');

					// only pick up serviceable
					// filter station passengers into board and noboard
					// only load board

					stationPassengersToStayArray = [];
					stationPassengersToBoardArray = stationPassengerListArray.filter((function (element) {
						if (lineAssetsMasterObject[this.trainLine + 'Line'].stationTypesOnLineArray.indexOf(element) !== -1) {
							// console.log('serviceable passenger found');
							return true;
						} else {
							stationPassengersToStayArray.push(element);
						}
					}).bind(this));
				// console.log('load at interchange successful');
				} else {
					// normal station, load all
					stationPassengersToBoardArray = stationPassengerListArray;
					stationPassengersToStayArray = [];
				}

				// console.log('after filter');
				// console.log('stationPassengersToStayArray is', stationPassengersToStayArray);
				// console.log('stationPassengersToBoardArray is', stationPassengersToBoardArray);
				// console.log('stationPassengerListArray is', stationPassengerListArray);

				// refresh vars after filtering
				stationPassengerstoBoardNumbers = stationPassengersToBoardArray.length;
				stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList = stationPassengersToStayArray;
				boundTrainLoadCycle();
			}

			// train load cycle is a self recursive function limited by an if conditional
			// train takes 333ms to load 1 passenger
			function trainLoadCycle () {
				// console.log('trainloadcycle stationPassengerstoBoardNumbers is', stationPassengerstoBoardNumbers);
				// general load logic
				if ((stationPassengerstoBoardNumbers > 0) && (trainPassengerNumbers < trainCapacity)) {
					trainLoadCycleTimeout = setTimeout((function () {
						// remove 1 passenger from station, push 1 symbol into train
						var passengerToBoard = stationPassengersToBoardArray.shift();
						if (passengerToBoard !== undefined) this.trainPassengerListArray.push(passengerToBoard); // to prevent pushing in phamtom passengers

						// refresh variables to latest values
						trainPassengerListArray = this.trainPassengerListArray;
						trainPassengerNumbers = trainPassengerListArray.length;
						stationPassengerstoBoardNumbers = stationPassengersToBoardArray.length;

						// update display
						$('#gameGridCell_' + currentTrainGridLocation + ' .stationPlatform').text(stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList.join(' ') + ' ' + stationPassengersToBoardArray.join(' '));
						$('#train_' + this.trainID).text(this.trainPassengerListArray.join(' '));

						boundTrainLoadCycle();
					}).bind(this), 333);
				} else {
					// combine leftover passengers back into stationPassengerList
					// console.log('stationPassengerList actual', stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList);
					// console.log('stationPassengersToBoardArray is', stationPassengersToBoardArray);

					stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList = stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList.concat(stationPassengersToBoardArray);
					// update visually
					$('#gameGridCell_' + currentTrainGridLocation + ' .stationPlatform').text(stationAssetsMasterObject['station' + currentTrainGridLocation].stationPassengerList.join(' '));
					this.isTrainFreeToMove = true;
				}
			}

			var boundTrainUnloadCycle = trainUnloadCycle.bind(this);
			var boundTrainLoadPrep = trainLoadPrep.bind(this);
			var boundTrainLoadCycle = trainLoadCycle.bind(this);

			// unload train prep starts ///////////////////////////////////////
			if (this.isTrainToBeRemoved === true) {
				// train is to be removed, alighting all passengers
				this.trainPassengerListArray = [];
				var passengersToAlight = trainPassengerListArray;
				boundTrainUnloadCycle();
			} else if (trainPassengerNumbers > 0) {
				// train has passengers, preparing for unloading

				if (lineAssetsMasterObject[this.trainLine + 'Line'].interchangeOnLineListObject[currentTrainGridLocation] !== undefined) {
					// station is an interchange
					// console.log('interchange detected on ', this.trainLine, ' line');

					if (Object.keys(lineAssetsMasterObject[this.trainLine + 'Line'].interchangeOnLineListObject).length === 1) {
						// station is the only interchange
						var passengersOnBoard = [];
						var passengersToAlight = trainPassengerListArray.filter((function (element) {
							if (element === currentGridstationType) {
								// unload if passenger matches station
								return true;
							} else if (lineAssetsMasterObject[this.trainLine + 'Line'].stationTypesOnLineArray.indexOf(element) === -1) {
								// unload if passenger cannot be serviced on this line
								return true;
							} else {
								passengersOnBoard.push(element);
							}
						}).bind(this));
					// console.log('unload at ONLY interchange successful');
					} else {
						// there is more than one interchange

						var passengersOnBoard = [];
						// iterate through passenger list
						var passengersToAlight = trainPassengerListArray.filter((function (element) {
							if (element === currentGridstationType) {
								// unload if passenger matches station
								return true;
							} else {// passenger does not match current station

								// unload if passenger is unserviceable on this line BUT can be serviced at this interchange
								if (lineAssetsMasterObject[this.trainLine + 'Line'].stationTypesOnLineArray.indexOf(element) === -1) {
									// passenger is unserviceable

									// iterate through lineColours of current interchange
									$.each(stationAssetsMasterObject['station' + currentTrainGridLocation].stationLinesArray, (function (lineColourKey, lineColourValue) {

										// if iterated line is not the current line the train is on
										if (lineColourValue !== this.trainLine) {

											// if passenger can be serviced at this interchange, drop
											if (lineAssetsMasterObject[lineColourValue + 'Line'].stationTypesOnLineArray.indexOf(element) !== -1) {
												return true;
											} else {
												passengersOnBoard.push(element);
											}
										}
									}).bind(this));
								} else {
									passengersOnBoard.push(element);
								}
							}
						}).bind(this));
						console.log('unload at an interchange successful');
					}	// more than 1 interchange end
				} else {
					// station is a ordinary station
					var passengersOnBoard = [];
					var passengersToAlight = trainPassengerListArray.filter(function (element) {
						if (element === currentGridstationType) {
							return true;
						} else {
							passengersOnBoard.push(element);
						}
					});
				}

				// update train passenger list with filter
				this.trainPassengerListArray = passengersOnBoard;

				// display rearranged passengers
				$('#train_' + this.trainID).text(this.trainPassengerListArray.join(' ') + ' ' + passengersToAlight.join(' '));
				// unload train prep ends ///////////////////////////////////////

				boundTrainUnloadCycle();
			} else {
				// train has no passengers
				boundTrainLoadPrep();
			}
		}
	};
}	// train constructor end
/*					- Constructors end -					*/

/*					- intial display logic start -					*/
function displayLogic () {
	gameGridArray.forEach(function (element, index) {
		// creates game grid
		$('#gameGridContainer').append('<div id="gameGridCell_' + index + '" class="gameGridCell"><span class="debugGrid">' + index + '</span></div>');
	});

	// displays stations
	for (prop in stationAssetsMasterObject) {
		if (stationAssetsMasterObject[prop].stationStatus === 'active') {
			var stationGridLocation = stationAssetsMasterObject[prop].stationGridLocation;

			$('#gameGridCell_' + stationGridLocation).append('<span id="station_' + stationGridLocation + '" class="trainStations">' + stationAssetsMasterObject[prop].stationType + '</span><span class="stationPlatform"></span>');
			$('#gameGridCell_' + stationGridLocation + ' .stationPlatform').text(stationAssetsMasterObject[prop].stationPassengerList.join(' '));
		}
	}
}
displayLogic();
/*					- intial display logic end -					*/

/*					- function definition start -					*/
// function to randomly generate passengers at stations
// generation probability is 10%
function generatePassengers () {
	$.each(stationAssetsMasterObject, function (key, value) {
		if (value.stationStatus === 'active') {
			var genPassRNG = Math.floor(Math.random() * 10 + 1);// RNG 1 to 10
			if (genPassRNG > 9) {
				// only generate if station has less than 10 passengers
				if (value.stationPassengerList.length < 10) {
					// if station is square, equal probability of circle or triangle
					if (value.stationTypePlaintext === 'square') {
						var genPassTypeRNG = Math.floor(Math.random() * 2 + 1);// RNG 1 to 2
						if (genPassTypeRNG === 1) value.stationPassengerList.push('\u2B24'); // push in circle passenger
						else value.stationPassengerList.push('\u25B2'); // push in triangle passenger
					}
					// if station is circle, 20% probability of square, else triangle
					else if (value.stationTypePlaintext === 'circle') {
						var genPassTypeRNG = Math.floor(Math.random() * 5 + 1);// RNG 1 to 5
						if (genPassTypeRNG === 1) value.stationPassengerList.push('\u2B1B'); // push in square passenger
						else value.stationPassengerList.push('\u25B2'); // push in triangle passenger
					}
					// if station is triangle, 20% probability of square, else circle
					else if (value.stationTypePlaintext === 'triangle') {
						var genPassTypeRNG = Math.floor(Math.random() * 5 + 1);// RNG 1 to 5
						if (genPassTypeRNG === 1) value.stationPassengerList.push('\u2B1B'); // push in square passenger
						else value.stationPassengerList.push('\u2B24'); // push in circle passenger
					}
				}

				$('#gameGridCell_' + value.stationGridLocation + ' .stationPlatform').text(value.stationPassengerList.join(' '));
				$('#station_' + value.stationGridLocation).css('background-color', '#2c9603');
				setTimeout(function () {
					$('#station_' + value.stationGridLocation).css('background-color', 'black');
				}, 500);
			}
		}
	});
}

// function to unhide stations from hardcoded station object
function generateStations () {
	var stationsStillHiddenCount = 0;
	var stationsStillHiddenArray = [];

	$.each(stationAssetsMasterObject, function (key, value) {
		if (value.stationStatus === 'hidden') {
			stationsStillHiddenCount++;
			stationsStillHiddenArray.push(key);
		}
	});
	if (stationsStillHiddenCount > 0) {
		var chosenStationIndex = Math.floor(Math.random() * stationsStillHiddenArray.length);
		var chosenStationKey = stationsStillHiddenArray[chosenStationIndex];
		stationAssetsMasterObject[chosenStationKey].stationStatus = 'active';
		var stationGridLocation = stationAssetsMasterObject[chosenStationKey].stationGridLocation;

		// display new station
		$('#gameGridCell_' + stationGridLocation).append('<span id="station_' + stationGridLocation + '" class="trainStations">' + stationAssetsMasterObject[chosenStationKey].stationType + '</span><span class="stationPlatform"></span>');
		$('#gameGridCell_' + stationGridLocation + ' .stationPlatform').text(stationAssetsMasterObject[chosenStationKey].stationPassengerList.join(' '));
	}
}

// checks stations for overloading, when overloaded, will flash red for 500ms
function checkStationOverload () {
	$.each(stationAssetsMasterObject, function (key, value) {
		if (value.stationPassengerList.length > 6) {
			$('#gameGridCell_' + value.stationGridLocation).css('background-color', 'red');
			setTimeout(function () {
				$('#gameGridCell_' + value.stationGridLocation).css('background-color', 'black');
			}, 500);
			value.stationOverloadCounter++;
		} else {
			value.stationOverloadCounter = 0;
			clearInterval(rapidRedFlashInterval);
		}
		if (value.stationOverloadCounter > 2) {
			function rapidRedFlash () {
				$('#gameGridCell_' + value.stationGridLocation).css('background-color', 'red');
				setTimeout(function () {
					$('#gameGridCell_' + value.stationGridLocation).css('background-color', 'black');
				}, 250);
			}
			clearInterval(rapidRedFlashInterval);
			rapidRedFlashInterval = setInterval(function () {
				rapidRedFlash();
			}, 500);
		}
		if (value.stationOverloadCounter > 5) {
			// 5 blinks per 2 secs, overloaded for 10 secs
			// lose condition
			if (disableLoseCondition === false) {
				clearInterval(passengerGeneratorInterval);
				clearInterval(stationOverloadedInterval);
				clearInterval(trainMovementInterval);
				clearInterval(rapidRedFlashInterval);
				clearTimeout(trainUnloadCycleTimeout);
				clearTimeout(trainLoadCycleTimeout);

				$('body').empty();
				$('body').append('<div id="gameover">GAME OVER!<br>A station was overloaded for too long ):<br> You successfully transported ' + passengersDelivered + ' passengers!</div>');
			}
		}
	});
}
/*					- function definition end -					*/

/*					- initialisation start -					*/
enableAllColoursBuildTrackEventListener();
$('.debug').hide();
$('.debugGrid').hide();
$('button').button();
/*					- initialisation end -					*/

/*					- intervals start -					*/
// interval to generate passengers, frequency is 500ms
passengerGeneratorInterval = setInterval(function () {
	generatePassengers();
}, 500);

// interval to check for station overload, every 2 secs
stationOverloadedInterval = setInterval(function () {
	checkStationOverload();
}, 2000);

// interval to generate stations , every 10 secs
generateStationsInterval = setInterval(function () {
	generateStations();
}, 10000);

// interval to move trains, every 333ms
trainMovementInterval = setInterval(function () {
	for (var prop in trainAssetsMasterObject) {
		trainAssetsMasterObject[prop].trainMovementLogic();
	}
}, 333);
/*					- intervals end -					*/
