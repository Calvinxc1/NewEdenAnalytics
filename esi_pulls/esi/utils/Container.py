class Container:
    init_params = ['_stored_keys']
    
    def __init__(self, _pass_obj=None, **kwargs):
        self._stored_keys = set()
        
        if isinstance(_pass_obj, dict):
            for key, val in _pass_obj.items():
                self.__setattr__(key, val)
        if isinstance(_pass_obj, Container):
            for key, val in _pass_obj._dict.items():
                self.__setattr__(key, val)
        
        for key, val in kwargs.items():
            self.__setattr__(key, val)
    
    def __setattr__(self, name, value):
        if name.startswith('_') & (name not in self.init_params):
            raise Exception('%s invalid key. Container does not support keys that start with _' % name)
        elif ' ' in name:
            raise Exception('%s invalid key. Container does not support keys that contain spaces' % name)
        
        self.__dict__[name] = value
        if name not in self.init_params:
            self._stored_keys.add(name)
            
    def __setitem__(self, key, val):
        self.__setattr__(key, val)
            
    def __getitem__(self, key):
        return self.__getattribute__(key)
        
    def __iter__(self):
        return iter(sorted(self._stored_keys))
    
    @property
    def _dict(self):
        dict_item = {}
        for key in self._stored_keys:
            val = self[key]
            if isinstance(val, Container): val = val._dict
            dict_item[key] = val
        return dict_item