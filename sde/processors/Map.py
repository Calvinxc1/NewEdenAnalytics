import os
import yaml
import pandas as pd

from processors.SDE import SdeProcessor

class MapProcessor(SdeProcessor):
    """ Processor class for all EVE SDE map items
    
    Processor controlling the loading of all EVE SDE
    map items. Draws from SdeProcessor, but this is
    a heavily modified version of the parent class.
    Takes several minutes to run.
    
    See SdeProcessor for Parameters & Attributes, with the
    following changes:
    
    Attributes
    ----------
    data_table: list
        List of all MariaDB Map data tables for inserting data
    file_path: str
        Path to map data folder
    name_map: list
        List of mapping values for the map_names method
    renames: dict
        Dictionary of dictionaries, containing all data renames
        necessary for all MariaDB map data tables
    sql: dict
        Addition of names key, for map_names method
    
    TODO: Implement Map object name mapping.
    TODO: Identify best commit_rows setting(s) for inserting.
    
    Version History:
        0.1 (2019-09-29) - First working iteration
    """
    
    commit_rows = 10000
    data_table = [
        'MapRegions', 'MapConstellations', 'MapSystems', 'MapStars',
        'MapPlanets', 'MapMoons', 'MapBelts', 'MapStations', 'MapStargates'
    ]
    file_path = 'fsd/universe'
    name_map = [{
        'table': 'MapRegions',
        'key': 'region_id',
        'name': 'region_name'
    },{
        'table': 'MapConstellations',
        'key': 'constellation_id',
        'name': 'constellation_name'
    },{
        'table': 'MapSystems',
        'key': 'system_id',
        'name': 'system_name'
    },{
        'table': 'MapStars',
        'key': 'star_id',
        'name': 'star_name'
    },{
        'table': 'MapPlanets',
        'key': 'planet_id',
        'name': 'planet_name'
    },{
        'table': 'MapMoons',
        'key': 'moon_id',
        'name': 'moon_name'
    },{
        'table': 'MapBelts',
        'key': 'belt_id',
        'name': 'belt_name'
    },{
        'table': 'MapStations',
        'key': 'station_id',
        'name': 'station_name'
    },{
        'table': 'MapStargates',
        'key': 'stargate_id',
        'name': 'stargate_name'
    }]
    renames = {
        'MapRegions': {
            'regionID': 'region_id', 'nameID': 'name_id', 'descriptionID': 'desc_id',
            'factionID': 'faction_id', 'wormholeClassID': 'wormhole_class_id',
            'nebula': 'nebula', 'min.0': 'min_x', 'min.1': 'min_y', 'min.2': 'min_z',
            'center.0': 'center_x', 'center.1': 'center_y', 'center.2': 'center_z',
            'max.0': 'max_x', 'max.1': 'max_y', 'max.2': 'max_z'
        },
        'MapConstellations': {
            'constellationID': 'constellation_id', 'nameID': 'name_id', 'descriptionID': 'desc_id',
            'regionID': 'region_id', 'factionID': 'faction_id', 'wormholeClassID': 'wormhole_class_id',
            'nebula': 'nebula', 'radius': 'radius', 'min.0': 'min_x', 'min.1': 'min_y',
            'min.2': 'min_z', 'center.0': 'center_x', 'center.1': 'center_y',
            'center.2': 'center_z', 'max.0': 'max_x', 'max.1': 'max_y', 'max.2': 'max_z'
        },
        'MapSystems': {
            'solarSystemID': 'system_id', 'solarSystemNameID': 'name_id', 'descriptionID': 'desc_id',
            'constellationID': 'constellation_id', 'effectTypeID': 'effect_type_id',
            'factionID': 'faction_id', 'wormholeClassID': 'wormhole_class_id',
            'luminosity': 'luminosity', 'nebula': 'nebula', 'radius': 'radius',
            'security': 'security', 'securityClass': 'security_class',
            'visualEffect': 'visual_effect', 'border': 'border', 'corridor': 'corridor',
            'fringe': 'fringe', 'hub': 'hub', 'international': 'international',
            'regional': 'regional', 'min.0': 'min_x', 'min.1': 'min_y', 'min.2': 'min_z',
            'center.0': 'center_x', 'center.1': 'center_y', 'center.2': 'center_z',
            'max.0': 'max_x', 'max.1': 'max_y', 'max.2': 'max_z'
        },
        'MapStars': {
            'starID': 'star_id', 'typeID': 'type_id', 'solarSystemID': 'system_id',
            'statistics.age': 'age', 'statistics.life': 'life', 'statistics.luminosity': 'luminosity',
            'statistics.radius': 'radius', 'statistics.spectralClass': 'spectral_class',
            'statistics.temperature': 'temperature', 'statistics.locked': 'locked',
            'primary_star': 'primary_star', 'position.0': 'pos_x',
            'position.1': 'pos_y', 'position.2': 'pos_z'
        },
        'MapPlanets': {
            'planetID': 'planet_id', 'planetNameID': 'name_id', 'typeID': 'type_id',
            'solarSystemID': 'system_id', 'celestialIndex': 'celestial_index',
            'statistics.density': 'density', 'statistics.eccentricity': 'eccentricity',
            'statistics.escapeVelocity': 'escape_velocity', 'statistics.life': 'life',
            'statistics.massDust': 'mass_dust', 'statistics.massGas': 'mass_gas',
            'statistics.orbitPeriod': 'orbit_period', 'statistics.orbitRadius': 'orbit_radius',
            'statistics.pressure': 'pressure', 'statistics.radius': 'radius',
            'statistics.rotationRate': 'rotation_rate', 'statistics.spectralClass': 'spectral_class',
            'statistics.surfaceGravity': 'surface_gravity', 'statistics.temperature': 'temperature',
            'planetAttributes.heightMap1': 'height_map_1', 'planetAttributes.heightMap2': 'height_map_2',
            'planetAttributes.shaderPreset': 'shader_preset', 'statistics.fragmented': 'fragmented',
            'statistics.locked': 'locked', 'planetAttributes.population': 'population',
            'position.0': 'pos_x', 'position.1': 'pos_y', 'position.2': 'pos_z'
        },
        'MapMoons': {
            'moonID': 'moon_id', 'moonNameID': 'name_id', 'typeID': 'type_id',
            'planetID': 'planet_id', 'statistics.density': 'density',
            'statistics.eccentricity': 'eccentricity', 'statistics.escapeVelocity': 'escape_velocity',
            'statistics.life': 'life', 'statistics.massDust': 'mass_dust',
            'statistics.massGas': 'mass_gas', 'statistics.orbitPeriod': 'orbit_period',
            'statistics.orbitRadius': 'orbit_radius', 'statistics.pressure': 'pressure',
            'statistics.radius': 'radius', 'statistics.rotationRate': 'rotation_rate',
            'statistics.spectralClass': 'spectral_class', 'statistics.surfaceGravity': 'surface_gravity',
            'statistics.temperature': 'temperature', 'planetAttributes.heightMap1': 'height_map_1',
            'planetAttributes.heightMap2': 'height_map_2', 'planetAttributes.shaderPreset': 'shader_preset',
            'statistics.fragmented': 'fragmented', 'statistics.locked': 'locked',
            'planetAttributes.population': 'population', 'position.0': 'pos_x',
            'position.1': 'pos_y', 'position.2': 'pos_z'
        },
        'MapBelts': {
            'beltID': 'belt_id', 'asteroidBeltNameID': 'name_id', 'typeID': 'type_id',
            'planetID': 'planet_id', 'statistics.density': 'density',
            'statistics.eccentricity': 'eccentricity', 'statistics.escapeVelocity': 'escape_velocity',
            'statistics.life': 'life', 'statistics.massDust': 'mass_dust',
            'statistics.massGas': 'mass_gas', 'statistics.orbitPeriod': 'orbit_period',
            'statistics.orbitRadius': 'orbit_radius', 'statistics.pressure': 'pressure',
            'statistics.radius': 'radius', 'statistics.rotationRate': 'rotation_rate',
            'statistics.spectralClass': 'spectral_class', 'statistics.surfaceGravity': 'surface_gravity',
            'statistics.temperature': 'temperature', 'statistics.fragmented': 'fragmented',
            'statistics.locked': 'locked', 'position.0': 'pos_x',
            'position.1': 'pos_y', 'position.2': 'pos_z'
        },
        'MapStations': {
            'stationID': 'station_id', 'typeID': 'type_id', 'parentID': 'parent_id',
            'parentType': 'parent_type', 'graphicID': 'graphic_id', 'operationID': 'operation_id',
            'ownerID': 'owner_id', 'reprocessingEfficiency': 'reproc_efficiency',
            'reprocessingHangarFlag': 'reproc_hanger_flag', 'reprocessingStationsTake': 'reproc_stations_take',
            'isConquerable': 'is_conquerable', 'useOperationName': 'use_operation_name',
            'position.0': 'pos_x', 'position.1': 'pos_y', 'position.2': 'pos_z'
        },
        'MapStargates': {
            'stargateID': 'stargate_id', 'typeID': 'type_id', 'solarSystemID': 'system_id',
            'destination': 'dest_stargate_id', 'position.0': 'pos_x',
            'position.1': 'pos_y', 'position.2': 'pos_z'
        }
    }
    sql = {
        **SdeProcessor.sql,
        'names': """\
            UPDATE {table}
            JOIN (
                SELECT {table}.{key},
                    ItemNames.item_name
                FROM {table}
                JOIN ItemNames
                    ON {table}.{key} = ItemNames.name_id
            ) AS Updater
                ON {table}.{key} = Updater.{key}
            SET {table}.{name} = Updater.item_name
        ;"""
    }
    
    def load_file(self, file_path:str) -> dict:
        """ Modified load_file for Map data
        
        Heavily modified load_file method from SdeProcessor
        designed to handle the multi-file format of the EVE
        SDE map data. Contains extensive hard-coded logic
        for parsing the map data files.
        
        os.walk's depth-first approach is crucial for the
        proper functioning of this method. It allows for
        successful mapping of region_id's to constellations
        and constellation_id's to systems.
        
        Parameters
        ----------
        file_path: str
            Indicates the location of the root for the EVE
            SDE map files.
            
        Returns
        -------
        dict
            Dictionary containing all applicable map file
            data in an unflattened format.
        """
        
        self._msg('Loading files...')
        
        load_path = self.load_path.format(
            sde_path=self.sde_path,
            file_path=file_path
        )
        
        data_buffer = {}
        for table in self.data_table: data_buffer[table] = []
            
        region_id = None
        constellation_id = None
        
        for path, dirs, files in self._tqdm(list(os.walk(load_path))):
            if 'region.staticdata' in files:
                data_path = '{path}/region.staticdata'.format(path=path)
                with open(data_path) as file: data_item = yaml.load(file, Loader=yaml.CLoader)
                data_buffer['MapRegions'].append(data_item)
                region_id = data_item['regionID']
                
            elif 'constellation.staticdata' in files:
                data_path = '{path}/constellation.staticdata'.format(path=path)
                with open(data_path) as file: data_item = yaml.load(file, Loader=yaml.CLoader)
                data_item['regionID'] = region_id
                data_buffer['MapConstellations'].append(data_item)
                constellation_id = data_item['constellationID']
                
            elif 'solarsystem.staticdata' in files:
                data_path = '{path}/solarsystem.staticdata'.format(path=path)
                with open(data_path) as file: data_item = yaml.load(file, Loader=yaml.CLoader)
                system, stars, planets, moons, belts, stations, stargates = self.parse_system(data_item, constellation_id)
                data_buffer['MapSystems'].append(system)
                data_buffer['MapStars'].extend(stars)
                data_buffer['MapPlanets'].extend(planets)
                data_buffer['MapMoons'].extend(moons)
                data_buffer['MapBelts'].extend(belts)
                data_buffer['MapStations'].extend(stations)
                data_buffer['MapStargates'].extend(stargates)
                
        return data_buffer
    
    def parse_system(self, system:dict, constellation_id:int) -> (dict, list, list, list, list, list, list):
        """ Parser for system data
        
        Parses a single system's data, and implements
        sub-parsers for all system sub-items.
        
        Parameters
        ----------
        system: dict
            Dictionary item for th esystem to be parsed
        constellation_id: int
            id for the constellation the parsed system
            is a part of
            
        Returns
        -------
        tuple
            Tuple containing all system and sub-data,
            split by MariaDB table insertion needs.
        tuple[0]: dict
            Parsed system data, not flattened
        tuple[1-6]: list
            Lists of parsed system data in dictionary
            form, not flattened.
            Tuple sequence: Stars, Planets, Moons,
                            Belts, Stations, Stargates
        
        TODO: Implement loading of disallowedAnchorCategories
              and disallowedAnchorGroups data to MariaDB
        """
        
        system['constellationID'] = constellation_id
        system['effectTypeID'] = system.get('secondarySun', {}).get('effectBeaconTypeID', None)
        
        _ = system.pop('sunTypeID', None)
        _ = system.pop('disallowedAnchorCategories', None)
        _ = system.pop('disallowedAnchorGroups', None)
        
        stars = self.parse_stars(system.pop('star', {}), system.pop('secondarySun', {}), system['solarSystemID'])
        planets, moons, belts, stations = self.parse_planets(system.pop('planets', {}), system['solarSystemID'])
        stargates = self.parse_stargates(system.pop('stargates', {}), system['solarSystemID'])
        
        return (system, stars, planets, moons, belts, stations, stargates)
    
    def parse_stars(self, primary_star:dict, secondary_star:dict, system_id:int) -> list:
        """ Parser for system star data
        
        Parses a system's star data. Note that though
        there may be no system stars, both star parameters
        must receive at least an empty dictionary for
        this method to function correctly.
        
        Parameters
        ----------
        primary_star: dict
            Data on the primary star in the system
            currently being parsed
        secondary_star: dict
            Data on the secondary star in the system
            currently being parsed
        system_id: int
            Id number of the currently parsed system
            
        Returns
        -------
        list
            List of parsed stars, if present in parsed
            system. If no stars present then returns
            an empty list
        """
        
        stars = []
        
        if 'id' in primary_star:
            primary_star['starID'] = primary_star.pop('id')
            primary_star['solarSystemID'] = system_id
            primary_star['primary_star'] = True
            primary_star['position'] = [0,0,0]
            _ = primary_star.pop('radius', None)
            stars.append(primary_star)
        
        if 'itemID' in secondary_star:
            secondary_star['starID'] = secondary_star.pop('itemID')
            secondary_star['solarSystemID'] = system_id
            secondary_star['primary_star'] = False
            _ = secondary_star.pop('effectBeaconTypeID', None)
            stars.append(secondary_star)
        
        return stars
    
    def parse_planets(self, planets:dict, system_id:int) -> (list, list, list, list):
        """ Parser for system planets
        
        Parses a system's planets, as well as the planet's
        sub-items. Note that even if there are no planets
        in a system (this doesn't actually happen), this
        method must receive at least an empty dictionary
        to function properly.
        
        Parameters
        ----------
        planets: dict
            Data on the planets in the currently parsed
            system
        system_id: int
            Id number of the currently parsed system
            
        Returns
        -------
        tuple
            Tuple containing all parsed system planets
            planet and sub-data, split by MariaDB table
            insertion needs
        tuple[0-3]: list
            Lists of parsed planet data in dictionary form,
            not flattened
            Tuple sequence: Planets, Moons, Belts, Stations
        """
        
        planets_parsed = []
        moons_parsed = []
        belts_parsed = []
        stations_parsed = []

        for planet_id, planet_data in planets.items():
            planet_data['planetID'] = planet_id
            planet_data['solarSystemID'] = system_id
            
            moons, stations_moons = self.parse_moons(planet_data.pop('moons', {}), planet_id)
            belts = self.parse_belts(planet_data.pop('asteroidBelts', {}), planet_id)
            stations = self.parse_stations(planet_data.pop('npcStations', {}), planet_id, 'planet')
            
            _ = planet_data.pop('radius', None)
            
            planets_parsed.append(planet_data)
            moons_parsed.extend(moons)
            belts_parsed.extend(belts)
            stations_parsed.extend(stations)
            stations_parsed.extend(stations_moons)
            
        return (planets_parsed, moons_parsed, belts_parsed, stations_parsed)
    
    def parse_moons(self, moons:dict, planet_id:int) -> (list, list):
        """ Parser for planet moons
        
        Parses a planet's moons, as well as the moons
        sub-items. Note that even if there are no moons
        at a planet this method must receive at least
        an empty dictionary to function properly.
        
        Parameters
        ----------
        moons: dict
            Data on the moons for the currently parsed
            planet
        planet_id: int
            Id number of the currently parsed planet
            
        Returns
        -------
        tuple
            Tuple containing all parsed planet moons
            and sub-data, split by MariaDB table
            insertion needs
        tuple[0-1]: list
            Lists of parsed moon data in dictionary form,
            not flattened
            Tuple sequence: Moons, Stations
        """
        
        moons_parsed = []
        stations_parsed = []
        
        for moon_id, moon_data in moons.items():
            moon_data['moonID'] = moon_id
            moon_data['planetID'] = planet_id
            
            stations = self.parse_stations(moon_data.pop('npcStations', {}), moon_id, 'moon')
            
            _ = moon_data.pop('radius', None)
            
            moons_parsed.append(moon_data)
            stations_parsed.extend(stations)
            
        return (moons_parsed, stations_parsed)
    
    def parse_belts(self, belts:dict, planet_id:int) -> list:
        """ Parser for planet asteroid belts
        
        Parses a planet's asteroid belts. Note
        that even if there are no belts at a
        planet this method must receive at least
        an empty dictionary to function properly.
        
        Parameters
        ----------
        belts: dict
            Data on the asteroid belts for the 
            currently parsed planet
        planet_id: int
            Id number of the currently parsed planet
            
        Returns
        -------
        list
            List of parsed asteroid belt data in
            dictionary form, not flattened
        """
        
        belts_parsed = []
        
        for belt_id, belt_data in belts.items():
            belt_data['beltID'] = belt_id
            belt_data['planetID'] = planet_id
            
            belts_parsed.append(belt_data)
            
        return belts_parsed
    
    def parse_stations(self, stations:dict, parent_id:int, parent_type:str) -> list:
        """ Parser for planet/moon NPC stations
        
        Parses a planet or moon's NPC stations. Note
        that even if there are no NPC stations at a
        planet or moon this method must receive at
        least an empty dictionary to function properly.
        
        Parameters
        ----------
        stations: dict
            Data on the stations for the currently
            parsed planet or moon
        parent_id: int
            Id number of the currently parsed planet
            or moon
        parent_type: str
            Indicates whether or not the parent of the
            parsed stations is a planet or moon
            
        Returns
        -------
        list
            List of parsed NPC station data in
            dictionary form, not flattened
        """
        
        stations_parsed = []
        
        for station_id, station_data in stations.items():
            station_data['stationID'] = station_id
            station_data['parentID'] = parent_id
            station_data['parentType'] = parent_type
            
            stations_parsed.append(station_data)
            
        return stations_parsed
    
    def parse_stargates(self, stargates:dict, system_id:int) -> list:
        """ Parser for system stargates
        
        Parses a system's stargates. Note that even if
        there are no stargates in a system this method
        must receive at least an empty dictionary to
        function properly.
        
        Parameters
        ----------
        stargates: dict
            Data on the stargates for the currently
            parsed system
        system_id: int
            Id number of the currently parsed system
            
        Returns
        -------
        list
            List of parsed stargates in dictionary
            form, not flattened
        """
        
        stargates_parsed = []
        for stargate_id, stargate_data in stargates.items():
            stargate_data['stargateID'] = stargate_id
            stargate_data['solarSystemID'] = system_id
            
            stargates_parsed.append(stargate_data)
        return stargates_parsed
    
    def flatten_data(self, raw_data:dict) -> dict:
        """ Modified flatten_data for map data
        
        Modified flatten_data method from SdeProcessor
        designed to handle the multi-file format of the EVE
        SDE map data.
        
        Parameters
        ----------
        raw_data: dict
            Dictionary of unflattened map data
            
        Returns
        -------
        dict
            Dictionary of flattened map data
        """
        
        self._msg('Flattening data...')
        
        flat_data = {}
        
        for key, val in self._tqdm(raw_data.items()):
            flat_data[key] = []
            for item in self._tqdm(val):
                flat_data[key].append(self._flatten_item(item))
            
        return flat_data
    
    def frame_construct(self, flat_data:dict, renames:dict) -> dict:
        """ Modified frame_construct for map data
        
        Modified frame_construct method from SdeProcessor
        designed to handle the multi-file format of the EVE
        SDE map data.
        
        Parameters
        ----------
        flat_data: dict
            Dictionary of flattened map data
        renames: dict
            Dictionary of raw column names to MariaDB
            column names
        
        Returns
        -------
        dict
            Dictionary of map data in Pandas DataFrame format
        """
        
        self._msg('Constructing DataFrames...')
        
        data_frame = {}
        for key, val in self._tqdm(flat_data.items()):
            data_frame[key] = pd.DataFrame(val)
            data_frame[key]['sde_version'] = self.sde_version
            data_frame[key].rename(columns=renames[key], inplace=True)
        
        return data_frame
    
    def upload_data(self, data_frame:dict, data_table:list):
        """ Modified upload_data for map data
        
        Modified upload_data method from SdeProcessor
        designed to handle the multi-file format of the EVE
        SDE map data.
        
        Parameters
        ----------
        data_frame: dict
            Dictionary of map data in Pandas DataFrame format
        data_table: list
            List of all MariaDB Map data tables for inserting data
        """
        
        self._msg('Uploading data...')
        
        self.init_maria(self.maria_login_path)
        
        for key in self._tqdm(data_table):
            self.delete_data(key)
            self.insert_data(data_frame[key], key, tqdm_leave=False)
            self.map_names(self.name_map)
        
        self.close_maria()
        
    def map_names(self, name_map:list):
        """ Adds names to map items
        
        Updates the map items to add names to them. Requires
        the ItemNames table to be populated before running
        
        Parameters
        ----------
        name_map:
            A list of dictionary objects for formatting the
            updater
        """
        cur = self.conn['maria'].cursor()
        for mapping in self._tqdm(name_map):
            sql_script = self.sql['names'].format(**mapping)
            cur.execute(sql_script)
            self.conn['maria'].commit()
        cur.close()