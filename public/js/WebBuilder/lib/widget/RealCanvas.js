Ext.define( 'WebBuilder.widget.RealCanvas', {
	extend : 'WebBuilder.widget.AbstractTemplateCanvas',

	emptyRootHeader  : 'Zde vytvořte strukturu stránky',
	emptyRootContent : 'Začít můžete tím, že si v knihovně po pravé straně vyberete vhodný layout stránky a přetažením ho umístíte na tuto plochu.',

	initComponent : function()
	{
		var me = this;

		me.tplCache = {};

		me.initInstanceTpl();

		me.callParent();
	},

	initInstanceTpl : function()
	{
		var me = this,
		    tpl;

		// create the slot renderer
		tpl = Ext.create( 'Ext.Template',
			'<div id="template-block-instance-{id}-slot-{slotName}" class="{slotCls}{% if( values.slots[\'{slotName}\'].length == 0 ) { %} {emptyCls}{% } %}{% if( values.isRoot() ) { %} x-root{% } %}{% if( values.isLocked() && values.slots[\'{slotName}\'].length > 0 ) { %} x-locked{% } %}">',
				'<div class="{titleCls} {slotTitleCls}">{[ values.template.slots().findRecord("codeName","{slotName}").get("title") ]}</div>',
				'{% if( values.isRoot() && \'{slotName}\' == \'content\' ) { %}',
					'<div class="x-empty-root-overlay">',
						'<h1>', me.emptyRootHeader ,'</h1>',
						'<p>', me.emptyRootContent ,'</p>',
					'</div>',
				'{% } %}',
				'<tpl for="values.slots[\'{slotName}\']">',
					'{[ this.getInstanceTpl( values ).apply( values ) ]}',
				'</tpl>',
			'</div>'
		);

		me.slotRendererCode = tpl.apply({
		    blockCls      : me.blockCls,
		    slotCls       : me.slotCls,
		    emptyCls      : me.emptyCls,
		    titleCls      : me.titleCls,
		    blockTitleCls : me.blockTitleCls,
		    slotTitleCls  : me.slotTitleCls,
		    blockToolsCls : me.blockToolsCls,
		    blockToolCls  : me.blockToolCls,
		    configToolCls : me.configToolCls,
		    removeToolCls : me.removeToolCls,

		    id            : '{id}',
		    slotName      : '$1',
		    blockTitle    : '{block.data.title}',
		    templateTitle : '{template.data.title}'
		});


		// create the instance tpl
		tpl = Ext.create( 'Ext.Template',
			'<div id="template-block-instance-{id}" class="{blockCls} x-block-category-{[ this.getBlockCategory( values ) ]}{% if( values.isRoot() ) { %} x-root{% } %}{% if( values.isLocked() ) { %} x-locked{% } %}">',
				'<div class="{titleCls} {blockTitleCls}">',
					'<span>',
						'{blockTitle}',
						'{% if ( values.block.templates().getCount() > 1 ) { %}',
							' [{templateTitle}]',
						'{% } %}',
					'</span>',
					'{% if( ! values.isLocked() ) { %}',
						'<div class="{blockToolsCls}">',
							'<div class="{blockToolCls} {configToolCls}"></div>',
							'<div class="{blockToolCls} {removeToolCls}"></div>',
						'</div>',
					'{% } %}',
				'</div>'

				// here comes the {content}

			// following is part of the blockFooter
			// '</div>'
		);

		me.blockHeader = tpl.apply({
		    blockCls      : me.blockCls,
		    titleCls      : me.titleCls,
		    blockTitleCls : me.blockTitleCls,
		    blockToolsCls : me.blockToolsCls,
		    blockToolCls  : me.blockToolCls,
		    configToolCls : me.configToolCls,
		    removeToolCls : me.removeToolCls,

		    id            : '{id}',
		    blockTitle    : '{block.data.title}',
		    templateTitle : '{template.data.title}'
		});

		me.blockFooter = '</div>';
	},

	/**
	 * Returns the template of given block instance
	 *
	 * @param {WebBuilder.BlockInstance} instance
	 * @return {Ext.Template}
	 */
	getInstanceTpl : function( instance )
	{
		var me       = this,
		    template = instance.template;

		if( me.tplCache[ template.getId() ] == null ) {
			var content = template.get('content');

			// remove non-designer parts of templates
			var designRe = /<!--\[if\s+design\]>([\s\S]*?)(?:<!\[else\]-->([\s\S]*?))?<!(?:--)?\[end\]-->/g;
			content = content.replace( designRe, '$1' );

			// replace slot nodes with some decodable garbage
			// this is needed, beacause Twig and XTemplates
			// has similiar syntax and we want to inject
			// some XTemplate code for slot rendering
			var twigSlotRe  = /{% slot ([\w-]+)[^%]+%}/gi,
			    localSlotRe = /#!&_slot_([\w-]+)_&!#/g;

			content = content.replace( twigSlotRe, '#!&_slot_$1_&!#' );

			// replace base tag
			var baseRe = /<base[\s\S]+?>/gi;

			content = content.replace( baseRe, '<base href="'+ me.module.env.baseHref +'">' );

			// remove unwanted Twig stuff
			var macroRe = /{%\s*macro[\s\S]*?%}[\s\S]*?{%\s*endmacro\s*%}/g;
			content = content.replace( macroRe, '' );

			var controlRe = /{%\s*(.*?)\s*%}/g;
			content = content.replace( controlRe, '' );

			// replace Twig variables
			var htmlTagRe  = /<[\s\S]+?>/g,
			    varRe      = /{{\s*([\w\.]+).*?\s*}}/g;
			    textareaRe = /(<textarea[^>]*>)[\s\S]+?(<\/textarea>)/gi;
			content = content.replace( htmlTagRe, function( tag ) { return tag.replace( varRe, '' ); }); // variables in the HTML tags
			content = content.replace( varRe, ' <span class="x-block-variable">[$1]</span>' );           // variables in the text nodes
			content = content.replace( textareaRe, '$1$2' );

			// setup slot rendering
			content = content.replace( localSlotRe, me.slotRendererCode );

			if( ! instance.isRoot() ) {
				content = me.blockHeader + content + me.blockFooter;
			}

			var tpl = Ext.create( 'Ext.XTemplate',
				content,
				{
					disableFormats : true,
					compiled       : true,
					getInstanceTpl   : Ext.Function.bind( me.getInstanceTpl, me ),
					getBlockCategory : function( instance ) {
						var nameParts = instance.block.get('codeName').split('\\');
						return Ext.String.uncapitalize( nameParts[ nameParts.length - 2 ] );
					}
				}
			);

			me.tplCache[ template.getId() ] = tpl;

		} else {
			tpl = me.tplCache[ template.getId() ];
		}

		return tpl;
	},

	/**
	 * Returns the template of given block instance
	 *
	 * @param {WebBuilder.BlockInstance} instance
	 * @return {Ext.Template}
	 */
	getDocumentTpl : function( instance )
	{
		return this.getInstanceTpl( instance );
	}
});