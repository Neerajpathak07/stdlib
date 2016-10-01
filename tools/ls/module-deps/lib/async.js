'use strict';

// MODULES //

var debug = require( 'debug' )( 'module-deps:async' );
var glob = require( 'glob' );
var prefix = require( './stdlib.js' );
var isFunction = require( prefix+'@stdlib/utils/is-function' );
var copy = require( prefix+'@stdlib/utils/copy' );
var readFileList = require( prefix+'@stdlib/fs/read-file-list' );
var defaults = require( './defaults.json' );
var validate = require( './validate.js' );
var analyze = require( './analyze.js' );


// LS //

/**
* Asynchronously generates a list of module dependencies.
*
* @param {Options} [options] - function options
* @param {string} [options.dir] - root directory from which to search for files
* @param {string} [options.pattern] - file glob pattern
* @param {Callback} clbk - callback to invoke upon completion
* @throws {TypeError} callback argument must be a function
* @throws {TypeError} options argument must be an object
* @throws {TypeError} must provide valid options
*
* @example
* ls( onList );
*
* function onList( error, results ) {
*     if ( error ) {
*         throw error;
*     }
*     console.dir( results );
* }
*/
function ls() {
	var options;
	var gopts;
	var clbk;
	var opts;
	var err;

	opts = copy( defaults );
	if ( arguments.length < 2 ) {
		clbk = arguments[ 0 ];
	} else {
		options = arguments[ 0 ];
		clbk = arguments[ 1 ];
		err = validate( opts, options );
		if ( err ) {
			throw err;
		}
	}
	if ( !isFunction( clbk ) ) {
		throw new TypeError( 'invalid input argument. Callback argument must be a function. Value: `' + clbk + '`.' );
	}
	debug( 'Options: %s', JSON.stringify( opts ) );

	gopts = {
		'cwd': opts.dir || '',
		'realpath': true // return absolute file paths
	};
	debug( 'Glob options: %s', JSON.stringify( gopts ) );

	debug( 'Searching for matching files...' );
	glob( opts.pattern, gopts, onGlob );

	/**
	* Callback invoked after matching files.
	*
	* @private
	* @param {(Error|null)} error - error object
	* @param {StringArray} names - list of matching files
	*/
	function onGlob( error, names ) {
		var opts;
		if ( error ) {
			debug( 'Encountered an error when searching for matching files: %s', error.message );
			return clbk( error );
		}
		if ( names.length === 0 ) {
			debug( 'Found 0 matching files.' );
			return clbk( null, [] );
		}
		debug( 'Found %d matching files: %s', names.length, names.join( ',' ) );

		debug( 'Reading file contents...' );
		opts = {
			'encoding': 'utf8'
		};
		readFileList( names, opts, onRead );
	} // end FUNCTION onGlob()

	/**
	* Callback invoked upon reading all file contents.
	*
	* @private
	* @param {(Error|null)} error - error object
	* @param {ObjectArray} files - file contents
	*/
	function onRead( error, files ) {
		if ( error ) {
			debug( 'Encountered an error when reading file contents: %s', error.message );
			return clbk( error );
		}
		debug( 'Finished reading file contents.' );

		debug( 'Analyzing file ASTs...' );
		files = analyze( files );
		debug( 'Finished analysis.' );

		clbk( null, files );
	} // end FUNCTION onRead()
} // end FUNCTION ls()


// EXPORTS //

module.exports = ls;
