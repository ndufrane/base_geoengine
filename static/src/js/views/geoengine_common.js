/*---------------------------------------------------------
 * OpenERP base_geoengine
 * Author B.Binet Copyright Camptocamp SA
 * Contributor N. Bessi Copyright Camptocamp SA
 * Contributor Laurent Mignon 2015 Acsone SA/NV
 * Contributor Yannick Vaucher 2015-2016 Camptocamp SA
 * License in __openerp__.py at root level of the module
 *---------------------------------------------------------
*/
odoo.define('base_geoengine.geoengine_common', function (require) {

/*---------------------------------------------------------
 * Odoo geoengine view
 *---------------------------------------------------------*/

var core = require('web.core');
var time = require('web.time');
var View = require('web.View');


var _lt = core._lt;
var QWeb = core.qweb;

var GeoengineMixin = {
    /**
     * Method: createBackgroundLayers
     * creates background layers from config
     *
     * Parameters:
     * bg_layers - {Array} the background layers array of config objects
     */
    createBackgroundLayers: function(bg_layers, geoengine) {
        var out = [];
        bg_layers.forEach(function(l) {
                switch (l.raster_type) {
                    case "wmts":
                        console.log("not supported");
                        var opt = {
                            name: l.name,
                            url: l.url.split(','),
                            layer: l.type,
                            style: 'default',
                            matrixSet: l.matrix_set
                        };
                        if (l.format_suffix) { opt.formatSuffix = l.format_suffix; }
                        if (l.request_encoding) { opt.requestEncoding = l.request_encoding; }
                        if (l.projection) { opt.projection = l.projection; }
                        if (l.units) { opt.units = l.units; }
                        if (l.resolutions) { opt.resolutions = l.resolutions.split(',').map(Number); }
                        if (l.max_extent) { opt.maxExtent = OpenLayers.Bounds.fromString(l.max_extent); }
                        if (l.server_resolutions) { opt.serverResolutions = l.server_resolutions.split(',').map(Number); }
                        if (l.dimensions) { opt.dimensions = l.dimensions.split(','); }
                        if (l.params) { opt.params = JSON.parse(l.params); }
                        break;
                    case "wmts_cap":
                        var parser = new ol.format.WMTSCapabilities();
                        unfetch(l.url).then(function(response) {
                          return response.text();
                        }).then(function(text) {
                          var result = parser.read(text);
                          var options = ol.source.WMTS.optionsFromCapabilities(result, {
                            layer: l.name,
                            matrixSet: l.matrix_set
                          });
                          options.crossOrigin = "Anonymous";
                          var wmts_layer = new ol.layer.Tile({
                                title: l.name,
                                type: l.overlay ? 'overlay' : 'base',
                                source: new ol.source.WMTS(options)
                          });

                          var found = false;
                          geoengine.map.getLayers().forEach(function(layer, i) {
                            if (layer instanceof ol.layer.Group) {
                                if(l.overlay && layer.get('title') === 'Overlays') {
                                    layer.getLayers().insertAt(0,wmts_layer);
                                    found = true;
                                }
                                if(!l.overlay && layer.get('title') === 'Base maps') {
                                    layer.getLayers().insertAt(0,wmts_layer);
                                    found = true;
                                }
                            }
                          });
                          if (found === false) {
                            geoengine.map.getLayers().insertAt(0,wmts_layer);
                          }
                       });
                       break;
                    case "osm":
                        out.push(
                            new ol.layer.Tile({
                                title: l.name,
                                visible: !l.overlay,
                                type:'base',
                                source: new ol.source.OSM()
                            })
                        );
                        break;
                    case "d_wms":
                        out.push(
                            new ol.layer.Tile({
                                title: l.name,
                                visible: !l.overlay,
                                type: l.overlay ? 'overlay' : 'base',
                                source: new ol.source.TileWMS({
                                    url: l.url,
                                    params: {'LAYERS': l.name, 'TILED': true},
                                    serverType: 'geoserver',
                                    crossOrigin: "Anonymous"
                                })
                            })
                        );
                        break;
                }
            });
        return out;
    },
};

return {
    // mixins
    GeoengineMixin: GeoengineMixin,
};
});
