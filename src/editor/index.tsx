/**
 * WordPress dependencies
 */

import { MediaUpload } from '@wordpress/media-utils';
import { mediaUpload } from '@wordpress/editor';
import { render } from '@wordpress/element';
import IsolatedBlockEditor, { EditorLoaded } from '@automattic/isolated-block-editor';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Local dependencies
 */

import BuddyPress from './buddypress';

/**
 * Save blocks to the comment form
 *
 * @param {string} content Comment content.
 */
function saveBlocks( textarea, content ) {
	if ( textarea ) {
		textarea.value = content;
	}
}

function setLoaded( container ) {
	const closest = container.closest( '.iso-editor__loading' );

	if ( closest ) {
		closest.classList.remove( 'iso-editor__loading' );
	}
}

function createContainer( textarea, existingContainer ) {
	if ( existingContainer && !existingContainer.contains( textarea ) ) {
		return existingContainer;
	}

	const container = document.createElement( 'div' );

	// Insert the container
	textarea.parentNode.insertBefore( container, textarea );

	return container;
}

function createEditorContainer( container, textarea, settings ) {
	if ( settings?.editor?.hasUploadPermissions ) {
		// Connect the media uploader if it's enabled
		settings.editor.mediaUpload = mediaUpload;
		addFilter( 'editor.MediaUpload', 'blocks-everywhere/media-upload', () => MediaUpload );
	} else {
		settings.editor.mediaUpload = ( { onError } ) => {
			onError( __( 'File uploading is disabled. Please use an image block and an external image URL.', 'blocks-everywhere' ) );
		};
	}

	render(
		<IsolatedBlockEditor
			settings={ settings }
			onSaveContent={ ( content ) => saveBlocks( textarea, content ) }
			onLoad={ ( parser ) => ( textarea && textarea.nodeName === 'TEXTAREA' ? parser( textarea.value ) : [] ) }
			onError={ () => document.location.reload() }
		>
			<EditorLoaded onLoaded={ () => setLoaded( container ) } />

			{ settings.editorType === 'buddypress' && <BuddyPress textarea={ textarea } /> }
		</IsolatedBlockEditor>,
		container
	);
}

// If the container is inside a form then we need insulate button clicks inside the editor from propagating out into the form
// This is because a lot of Gutenberg buttons don't set a 'type', and so default to 'submit'
function insulateForm( container ) {
	const form = container.closest( 'form' );

	if ( form ) {
		form.addEventListener( 'submit', ( ev ) => {
			if ( ev.submitter && ev.submitter.closest( '.iso-editor' ) ) {
				ev.stopPropagation();
				ev.preventDefault();
			}
		} );
	}
}

export default function createEditor( node ) {
	let container;

	// Prefer enclosing containers, so check if one exists outside.
	const outerContainerNode = node.closest( wpBlocksEverywhere.container );
	if ( outerContainerNode ) {
		container = createContainer( node, outerContainerNode );
	} else {
		container = createContainer( node, document.querySelector( wpBlocksEverywhere.container ) );
	}

	insulateForm( container );
	createEditorContainer( container, node, wpBlocksEverywhere );
}