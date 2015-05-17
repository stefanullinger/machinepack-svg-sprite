var cheerio = require( 'cheerio' );

module.exports = {
	friendlyName:        'Create sprite',
	description:         'Create an SVGs sprite from multiple SVG source files.',
	extendedDescription: '',
	cacheable:           true,
	sync:                true,
	inputs:              {
		svgs: {
			description: 'An array of SVGs to put into the sprite.',
			required:    true,
			typeclass:   'array'
		}
	},
	defaultExit:         'success',
	exits:               {
		error:   {
			description: 'Unexpected error occurred.'
		},
		success: {
			description: 'Done.'
		}
	},
	fn:                  createSprite
};

function createSprite( inputs, exits ) {
	var $spriteDocument = cheerio.load( '<svg><defs></defs></svg>', { xmlMode: true } );
	var $spriteSvg = $spriteDocument( 'svg' );
	var $spriteDefs = $spriteDocument( 'defs' ).first();

	inputs.svgs.forEach( function ( svg ) {
		var $svgDocument = cheerio.load( svg.content, {
			normalizeWhitespace: true,
			xmlMode:             true
		} );

		removeEmptyElements( $svgDocument );

		var $svg = $svgDocument( 'svg' );
		var $svgTitle = $svgDocument( 'title' );
		var $svgDescription = $svgDocument( 'desc' );
		var $svgDefs = $svgDocument( 'defs' ).first();

		$spriteDefs.append( $svgDefs.html() );
		$svgDefs.remove();

		var title = $svgTitle.first().html();
		var description = $svgDescription.first().html();

		// remove title and description as we will re-add them when
		// generating the symbol
		$svgTitle.remove();
		$svgDescription.remove();

		// if there is no title, use the provided id
		title = title || svg.id;

		$symbolDocument = generateSymbol( svg.id, $svg, title, description );

		// append the generated <symbol> to the SVG sprite
		$spriteSvg.append( $symbolDocument.html() );
	} );

	return exits.success( $spriteDocument.html() );
}

function generateSymbol( id, $svg, title, description ) {
	var $symbolDocument = cheerio.load( '<symbol>' + $svg.html() + '</symbol>', { xmlMode: true } );
	var $symbol = $symbolDocument( 'symbol' ).first();

	$symbol.attr( 'id', id );

	var viewBox = $svg.attr( 'viewBox' );

	if ( viewBox ) {
		$symbol.attr( 'viewBox', viewBox );
	}

	if ( description ) {
		$symbol.prepend( '<desc>' + description + '</desc>' );
	}

	if ( title ) {
		$symbol.prepend( '<title>' + title + '</title>' );
	}

	return $symbolDocument;
}

function removeEmptyElements( $ ) {
	$( 'g' ).each( function () {
		var $element = $( this );

		if ( !$element.children().length ) {
			$element.remove();
		}
	} );
}
