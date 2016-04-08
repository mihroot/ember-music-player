import Ember from 'ember';
import randomInt from '../utils/random-int';

export default Ember.Component.extend({

    VK:             Ember.inject.service('vk'),
    LastFM:         Ember.inject.service('lastfm'),
    AudioPlayer:    Ember.inject.service('audio-player'),
    Playlist:       Ember.inject.service('playlist'),

    Scene: null,
    Camera: null,
    Renderer: null,

    _ActiveThreeObject: null,
    _MovingFromObject: null,

    _camera_far: 5000,
    _camera_initial_y: -75,
    _distance_from_camera_to_active_object:  500,
    
    _distance_between_objects:  Ember.computed('_distance_from_camera_to_active_object', function() {
                                    return this.get('_distance_from_camera_to_active_object') * 1.5;
                                }),
    _first_visible_object_z:    null,
    _last_visible_object_z:     null,

    _min_available_playlist_item_offset: null,
    _max_available_playlist_item_offset: null,

    _objects_limit_to_show: 8,

    _auto_move_forward: false,

    _CameraXYTween: null,
    _MovementTween: null,

    _window_focus: true,


    actions: {
        /**
         * [onPlayerControlsAction description]
         * @param  {[type]} method_name [description]
         * @return {[type]}             [description]
         */
        onPlayerControlsAction(method_name) {
            var _args = Array.prototype.slice.call(arguments).splice(1, arguments.length);
            if (this.get('actions.'+method_name)) {
                return this.actions[method_name].apply(this, _args);
            }
            return false;
        },


        /**
         * [search description]
         * @return {[type]} [description]
         */
        search(query) {
            this.reset();
            this.searchSimilar(query);
        }
    },


    /**
     * [didInsertElement description]
     * @return {[type]} [description]
     */
    didInsertElement() {
        
        console.log('didInsertElement');

        var _Self = this;
        
        _Self._super(...arguments);

        _Self.sceneInit(this.$('#player-threejs-container'));
        _Self.animate(_Self);

        // Subscribe to AudioPlayer events
        _Self.get('AudioPlayer').on('playlistItemSet', function(PlaylistItem) {
            _Self.moveToObject(PlaylistItem.threeObject);
        });

        var _Playlist = _Self.get('Playlist');
        _Self.get('VK').getCurrentUserAudio().then(function(response) {
            var _playlist_items = _Playlist.processTracksFromVK(response);
            Ember.Logger.info('VK->getCurrentUserAudio: ' + _playlist_items.length + ' tracks added to playlist');

            if (_playlist_items.length) {
                _Self.addPlaylistItemsToScene(_playlist_items);
                _Self.get('AudioPlayer').setTrack(_playlist_items[0]);
            }
        });
    },


    /**
     * [willDestroyElement description]
     * @return {[type]} [description]
     */
    willDestroyElement() {
        // Unubscribe from AudioPlayer events
        this.get('AudioPlayer').off('playlistItemSet');

        this.$(window).unbind('.player_widget');
        this.$('body').unbind('.player_widget');
    },


    /**
     * [parentViewDidChange description]
     * @return {[type]} [description]
     */
    parentViewDidChange() {
        this.reset();
    },


    /**
     * [reset description]
     * @return {[type]} [description]
     */
    reset() { 
        var _Self = this;

        _Self.get('AudioPlayer').reset();
        _Self.get('Playlist').reset();

        var _Scene = _Self.get('Scene');
        var _scene_children_length = _Scene.children.length;

        while (_scene_children_length--) {
            _Scene.remove(_Scene.children[ _scene_children_length ]);
        }

        _Self.set('_ActiveThreeObject', null);
        _Self.set('_MovingFromObject', null);

        _Self.set('_first_visible_object_z', null);
        _Self.set('_last_visible_object_z', null);

        _Self.set('_min_available_playlist_item_offset', null);
        _Self.set('_max_available_playlist_item_offset', null);
    },


    /**
     * [sceneInit description]
     * @param  {[type]} $Container [description]
     * @return {[type]}            [description]
     */
    sceneInit($Container) {

        var _Self = this;

        var _Camera = new window.THREE.PerspectiveCamera(
                                                                    75,
                                                                    window.innerWidth / window.innerHeight,
                                                                    1,
                                                                    _Self.get('_camera_far')
                                                                );
            _Camera.position.y = _Self.get('_camera_initial_y');

        var _Sene = new window.THREE.Scene();

        var _Renderer = new window.THREE.CSS3DRenderer();
            _Renderer.setSize( window.innerWidth, window.innerHeight );
            _Renderer.domElement.style.position = 'absolute';
            _Renderer.domElement.style.top = 0;

        $Container.append( _Renderer.domElement );

        _Self.set('Camera', _Camera);
        _Self.set('Scene', _Sene);
        _Self.set('Renderer', _Renderer);

        //Event listeners
        this.$(window).bind('resize.player_widget', function(){return _Self._onWindowResize.apply(_Self, arguments);});
        this.$(document).bind('mousemove.player_widget', function(){return _Self._onMouseMove.apply(_Self, arguments);});

    },


    /**
     * [createThreeObject description]
     * @param  {[type]} entry [description]
     * @return {[type]}       [description]
     */
    createThreeObject(entry) {
        
        var _Self = this;

        var dom = document.createElement( 'a' );
            dom.style.position  = 'relative';
            dom.style.display   = 'block';
            dom.style.cursor    = 'pointer';
            dom.className       = 'entry';
            dom.id              = entry.p_offset+'-entry';

        var image = document.createElement( 'img' );
            image.className     = 'album-image';
            image.style.width   = '100%';
            image.style.height  = '100%';
            image.src = entry.album.image;
            image.style.display = image.src?'block':'none';
        
        dom.appendChild( image );

        var desc = document.createElement( 'div' );
            desc.className = 'desc';
            desc.innerHTML = entry.artist + ' - ' + entry.title;
    
        dom.appendChild( desc );
        
        var _Object = new window.THREE.CSS3DObject( dom );

            _Object.position.x = Math.random() * 2000 - 1000;
            _Object.position.y = Math.random() * 1000 - 0;
    
        if (_Self._last_visible_object_z === null) {
            _Self._first_visible_object_z = _Self._last_visible_object_z = _Object.position.z = 0;
        } else {
            _Self._last_visible_object_z = _Object.position.z = _Self._last_visible_object_z - (_Self.get('_distance_between_objects'));
        }
    
        
        //Detect window focus in and out.. requestAnimationFrame will not work if window is not visible, coz rendering will not happen
        window.addEventListener( 'focus', function() {
            _Self._window_focus = true;
        }, false );
        window.addEventListener( 'blur', function() {
            _Self._window_focus = false;
        }, false );

        dom.addEventListener( 'click', function( event ) {
            event.stopPropagation();
            if (_Object !== _Self._ActiveThreeObject) {
               _Self.get('AudioPlayer').setTrack(entry);
            } else {
                _Self.get('AudioPlayer').playPause();
            }
        }, false);
    

        return _Object;
    },


    /**
     * Adds selected playlist tracks to scene if this is still posible (_Scene.children.length < _Self._objects_limit_to_show)
     * @param {Array} playlist tracks array offsets
     * @return {void}
     * @public
     */
    addPlaylistItemsToScene(items, append) {
        
        var _Self = this;

        if (typeof(append) === 'undefined') {
            append = true;
        }
        
        var _Object;
        
        if (!Ember.isArray(items)) {
            items = [items];
        }

        var _Scene = this.get('Scene');

        items.every(function(_Item) {

            // Check if we reached visible objects per scene limit           
            if (append && _Scene.children.length >= _Self._objects_limit_to_show) {
                // Ember.Logger.info('Max objects per scene limit reached.');
                return false;
            }       
            
            if (!_Item['threeObject']) {
                
                _Object = _Self.createThreeObject( _Item );
                
                // Get additional track info from Last.FM (album cover, artist info, etc.)
                var _time = Date.now();
                _Self.get('LastFM').trackGetInfo(_Item.artist, _Item.title).then(function(data) {
                    //isn't to late? :)
                    if(_Self.get('Playlist').getResetTime() > _time) {
                        return false;
                    }

                    //Upgrade playlist item info if needed
                    if(data.listeners) {
                        _Item.listeners = data.listeners;
                    }
            
                    if(data.album) {
                        if(data.album.image) {
                            _Item.album.image = data.album.image[3]['#text'];
                        }
                    }
            
                    if(data.artist && data.artist.name) {
                        _Item.artist = data.artist.name;
                    }

                    _Self._onPlaylistItemUpdate(_Item);
                }, function(){});
                
            } else {
                
                _Object = _Item['threeObject'];
                
                if (append) {
                    _Self._last_visible_object_z = _Object.position.z = _Self._last_visible_object_z - _Self.get('_distance_between_objects');
                } else {
                    _Self._first_visible_object_z = _Object.position.z = _Self._first_visible_object_z + _Self.get('_distance_between_objects');
                }
                
            }
            
            //Add THREE Object to Scene
            _Scene.add( _Object );
            
            
            // //
            // Scene._availablePlaylistItems.push(_Item.p_offset);
                    
            
            if(_Self._min_available_playlist_item_offset === null || _Self._min_available_playlist_item_offset > _Item.p_offset) {
                _Self._min_available_playlist_item_offset = _Item.p_offset;
            }

            if(_Self._max_available_playlist_item_offset === null || _Self._max_available_playlist_item_offset < _Item.p_offset) {
                _Self._max_available_playlist_item_offset = _Item.p_offset;
            }
            
            
            _Item.threeObject = _Object;
            
            return true;
        });
        
        //Start playing first object
        // if(Playlist.length() && !Scene._ActiveObect) {
        //     Player.setTrack(Playlist.items[0]);
        // }

    },


    /**
     * [_onPlaylistItemUpdate description]
     * @param  {[type]} PlaylistItem [description]
     * @return {[type]}              [description]
     */
    _onPlaylistItemUpdate: function(PlaylistItem) {
        
        if (!PlaylistItem.threeObject) {
            return;
        }

        var $_El = this.$(PlaylistItem.threeObject.element);
        if(PlaylistItem.album.image) {
            $_El.find('.album-image').attr('src', PlaylistItem.album.image);
        }
    },


    /**
     * [move description]
     * @param  {[type]} delta [description]
     * @return {[type]}       [description]
     */
    move( delta ) {
        
        var _Self = this;

        var _Scene = this.get('Scene');
        var _Playlist = this.get('Playlist');

        var _scene_children_length = _Scene.children.length;
        if(!_scene_children_length) {
            return false;
        }
            
        //Min track playlist offset that visible in scene
        //var min_p_offset = Math.min.apply(null, Scene._availablePlaylistItems);
        //Maximum track playlist offset that visible in scene
        //var max_p_offset = Math.max.apply(null, Scene._availablePlaylistItems);
        
        
        var _max_allowed_z = - (_Self._objects_limit_to_show * _Self.get('_distance_between_objects'));
                
        
        //update last/first object Z position
        _Self._last_visible_object_z   += delta;
        _Self._first_visible_object_z  += delta;
        
        
        while (_scene_children_length--) {
        
            var _Object = _Scene.children[ _scene_children_length ];
            
            //update object Z position
            _Object.position.z += delta;

            
            var _track_p_offset = parseInt(_Object.element.getAttribute('id'), 10);

            var _playlist_items;
            
            //moving forward
            if (delta > 0) {
                
                //if object passed camera and we don't see it, remove object from scene
                if (_Object.position.z > 0 ) {
                                        
                    //remove non-visible object
                    _Self.removeObjectFromScene( _Object );
                    Ember.Logger.info('Object behind camera removed from scene');
                    
                    _playlist_items = _Playlist.getItems(_Self.get('_max_available_playlist_item_offset')+1, 1);
                    // console.log(_playlist_items);
                    if (_playlist_items) {
                        
                        //append one more object
                        _Self.addPlaylistItemsToScene(_playlist_items);
                        
                        Ember.Logger.info('Object added to scene');
                    }
                    
                }
            
            }
            //moving backward
            else if (delta < 0) {
                
                
                if(_Self._min_available_playlist_item_offset && _Self._min_available_playlist_item_offset === _track_p_offset) {
                                        
                    if(_Object.position.z < - _Self.get('_distance_between_objects')) {
                        
                        _playlist_items = _Playlist.getItems(_Self.get('_min_available_playlist_item_offset')-1, 1);

                        if(!(_playlist_items[0]['threeObject'].parent instanceof window.THREE.Scene)) {
                            
                            //Return Object to Scene
                            _Self.addPlaylistItemsToScene(_playlist_items, false);
                            
                            Ember.Logger.info('Object returned to scene');
                        }
                    }
                    
                }
                
                
                //Check if object is too far
                if( _Object.position.z < _max_allowed_z) {
                    
                    //
                    if(_Self._MovingFromObject === _Object) {
                        _Self._MovingFromObject = _Playlist.items[_Self.get('_max_available_playlist_item_offset')-1]['threeObject'];
                    }
                                        
                    
                    //remove non-visible object
                    _Self.removeObjectFromScene( _Object );
                    
                    Ember.Logger.info('Far object hided from scene');
                }
                
            
            }
            
        }   

    },


    /**
     * Remove THREE Object from Scene
     * @param {Object} THREE Object
     * @return {void}
     * @public
     */
    removeObjectFromScene(_Object) {
            
        var _Self = this;

        var _Scene = _Self.get('Scene');

        var _track_p_offset = parseInt(_Object.element.getAttribute('id'), 10);
        
        
        // for (var j in _Self._availablePlaylistItems) {
        //     if(_Self._availablePlaylistItems[j] === _track_p_offset) {
        //         _Self._availablePlaylistItems.splice(j, 1);
        //         break;
        //     }
        // }
                                            
        
        //remove
        _Scene.remove( _Object );
            
        
        if (_Self._max_available_playlist_item_offset === _track_p_offset) {
            
            //Update last object Z
            _Self._last_visible_object_z += _Self.get('_distance_between_objects');
            
            //Maximum track playlist offset that visible in scene
            // _Self._max_available_playlist_item_offset = Math.max.apply(null, _Self._availablePlaylistItems);
            _Self._max_available_playlist_item_offset -= 1;
        }
        
        
        if (_Self._min_available_playlist_item_offset === _track_p_offset) {
            
            //Update last object Z
            _Self._first_visible_object_z -= _Self.get('_distance_between_objects');
            
            //Min track playlist offset that visible in scene
            // _Self._min_available_playlist_item_offset = Math.min.apply(null, _Self._availablePlaylistItems);
            _Self._min_available_playlist_item_offset += 1;
        }
        
    },


    /**
     * Moves to new active THREE CSS3DObject
     * @param {Object} THREE CSS3DObject we are moving to
     * @return {void}
     * @public
     */
    moveToObject: function(_Object) {

        var _Self = this;

        var _Camera = _Self.get('Camera');

        if (_Self._ActiveThreeObject) {
            _Self._ActiveThreeObject.element.className = 'entry';
        }
        
        // If tween was started from object that is not visible now, reset _Self._MovingFromObject
        if (_Self._MovingFromObject && _Self._MovingFromObject.position.z > 0) {
            _Self._MovingFromObject = null;
        }   
        
        
        // If new object is behind camera, set _Self._MovingFromObject only if it == null.
        // In case if multiple clicks for previous track, we need valid Z coordinate, that calculated only for visible objects
        if ((_Object.position.z > 0 && !_Self._MovingFromObject) || _Object.position.z <= 0) { 
            _Self._MovingFromObject = _Self._ActiveThreeObject;
        }
        
        
        var _obj_moving_to_offset    = parseInt(_Object.element.getAttribute('id'), 10);
        var _obj_moving_from_offset  = 0; var _obj_moving_from_z = 0;
        
        if (_Self._MovingFromObject) {
            
            // Get playlist offset of object we are moving from
            _obj_moving_from_offset  = parseInt(_Self._MovingFromObject.element.getAttribute('id'), 10);
            
            // Get Z coordinate of object we are moving from
            _obj_moving_from_z       = _Self._MovingFromObject.position.z;
            
        }
        
        
        // Set new Active object
        _Self._ActiveThreeObject        = _Object;
        _Self._ActiveThreeObject.element.className = 'entry active';
            
        
        //Z distance to run
        var _z_distance_to_run = _obj_moving_from_z + _Self._distance_from_camera_to_active_object -
                                    (_obj_moving_to_offset - _obj_moving_from_offset) * _Self.get('_distance_between_objects');
        

        //Stop uncompleted tween
        if (_Self._MovementTween) {
            _Self._MovementTween.stop();
        }
        

        // Move scene objects
        // If we have focus on window and requestAnimationFrame is working, we move everything with animation.
        // If not, we just change coordinates
        if (_Self._window_focus) {
            
            _Self._MovementTween = new window.TWEEN.Tween( { value: _z_distance_to_run } )
                .to( { value: 0  }, 2000 )
                .onUpdate( function () {
    
                    _Self.move( this.value - _z_distance_to_run );
                    _z_distance_to_run = this.value;
    
                } )
                .onComplete(function() {
                    
                    _Self._MovementTween    = null;
                    _Self._MovingFromObject = null;
            
                })
                .easing( window.TWEEN.Easing.Exponential.Out )
                .start();
                          
            //Move camera by X and Y
            _Self._moveCameraXY(_Camera.position, { x: _Object.position.x, y: _Object.position.y + _Self._camera_initial_y }, 1500);
        
        } else {

            _Self.move( - _z_distance_to_run );
            _Camera.position.x = _Object.position.x;
            _Camera.position.y = _Object.position.y + _Self._camera_initial_y;

            _Self._MovementTween    = null;
            _Self._MovingFromObject = null;
        
        }
        
        
    },


    /**
     * [_onMouseMove description]
     * @param  {[type]} event [description]
     * @return {[type]}       [description]
     */
    _onMouseMove( event ) {
        
        var _mouse_x = event.pageX;
        var _mouse_y = event.pageY;
        
        this._parallax(_mouse_x, _mouse_y);
    },


    /**
     * [_parallax description]
     * @param  {[type]} mx [description]
     * @param  {[type]} my [description]
     * @return {[type]}    [description]
     */
    _parallax: function(mx, my) {
                
        //parallax only when activeObject set
        if(!this._ActiveThreeObject) {
            return false;
        }
        
        var _sh_1    = 0.03;
        var _sh_2    = -0.03;

        
        var _x = (_sh_1*(mx - document.body.clientWidth/2))+this._ActiveThreeObject.position.x;
        var _y = _sh_2*(my - document.body.clientHeight/2)+this._ActiveThreeObject.position.y + this._camera_initial_y;
        
        var _Camera = this.get('Camera');

        _Camera.position.x = _x;
        _Camera.position.y = _y;
        
        // this._moveCameraXY(_Camera.position, {x: _x, y: _y}, 0, true);
    },
        

    /**
     * [_moveCameraXY description]
     * @param  {[type]} from    [description]
     * @param  {[type]} to      [description]
     * @param  {[type]} time    [description]
     * @param  {[type]} nonstop [description]
     * @return {[type]}         [description]
     */
    _moveCameraXY: function(from, to, time, nonstop) {
        
        var _Self = this;

        if(!_Self._CameraXYTween) {
            _Self._CameraXYTween = new window.TWEEN.Tween( from )
                                    .to( to , time )
                                    .easing( window.TWEEN.Easing.Exponential.Out )
                                    .onComplete(function() {
                                        _Self._CameraXYTween = null;
                                    })
                                    .start();
        }
        else {
            if(nonstop === undefined || !nonstop) {
                _Self._CameraXYTween.stop().to( to , time ).start();
            }
            else {
                _Self._CameraXYTween.to( to , time ).start();
            }
        }
            
    },


    /**
     * [animate description]
     * @param  {[type]} context [description]
     * @return {[type]}         [description]
     */
    animate(Context) {
        
        Ember.assert('You must pass a valid context to animate', Context);

        window.requestAnimationFrame( 
            function() {
                Context.animate(Context);
            }
        );
                
        window.TWEEN.update();

        if( Context._auto_move_forward === true ) {
            Context.move( 1 );
        }
        
        // if(Player._equalizer) {
        //     Player._equalizer.draw();
        // }
        
        Context.get('Renderer').render( Context.get('Scene'), Context.get('Camera') );
    },


    /**
     * [_onWindowResize description]
     * @return {[type]} [description]
     */
    _onWindowResize() {

        var _Camera     = this.get('Camera');
        var _Renderer   = this.get('Renderer');

        _Camera.aspect = window.innerWidth / window.innerHeight;
        _Camera.updateProjectionMatrix();

        _Renderer.setSize( window.innerWidth, window.innerHeight );

    },


    /**
     * [searchSimilar description]
     * @param  {[type]} query [description]
     * @return {[type]}   [description]
     */
    searchSimilar(query) {
        var _Self = this;

        return _Self.get('LastFM').artistGetSimilar(query, 20).then(function(data) {
            
            Ember.Logger.info('searchSimilar: ' + data.length + ' artists found');
            
            data.forEach(function(artist) {

                var _query = {
                    q: artist.name,
                    performer_only: 1,
                    count: 30,
                    sort: 2 // 2 — popularity, 1 — duration, 0 - add date
                };

                _Self.get('VK').api('audio.search', _query).then(function(response) {
                    
                    //-1, VK return total audio files in first row
                    var _items_found = (response.response.length - 1);
                    // console.log('VKSearchAudio: ' + artist.name + ' - ' + _items_found + ' items found ');
                    if (_items_found) {
                        //Calc random audio index
                        var _i = randomInt(1, _items_found);

                        var _playlist_items = _Self.get('Playlist').processTracksFromVK(response.response[_i]);
                        _Self.addPlaylistItemsToScene(_playlist_items);
                        
                        if (!_Self.get('AudioPlayer.CurrentPlaylistItem')) {
                            _Self.get('AudioPlayer').setTrack(_playlist_items[0]);
                        }
                    }

                }, function(error){console.log(error);});
            });
        }, function(){});
    }

});
