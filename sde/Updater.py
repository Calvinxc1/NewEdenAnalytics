from datetime import datetime as dt
import os
import shutil
import requests as rq
from zipfile import ZipFile as zf
import io

class SdeUpdater:
    """ EVE SDE Update Controller
    
    Controller class for the EVE SDE Updater.
    
    Parameters
    ----------
    processors: list
        List of SDE processor classes to run
    sde_url: str
        URL where the SDE file can be retrieved from
    sde_path: str, optional
        Folder the SDE file unzips into (default 'sde')
    verbose: bool, optional
        Enables verbose logging. Overridden to True if
        in diagnostic mode (default False)
    diag: bool
        Enables diagnostic mode, helpful for making
        new processors. Overrides verbose to True
        
    TODO: Implement more processor classes; Notably finish
          out the Types processors, build out the Blueprints
          processors, and the IndustryActivities processor.
          
    Version History:
        0.1 (2019-09-29) - First working iteration
    """
    
    def __init__(self, processors:list, sde_url:str, sde_path='sde', verbose=False, diag=False):
        self.processors = processors
        self.sde_path = sde_path
        self.sde_url = sde_url
        self.verbose = True if diag else verbose
        self.diag = diag
        
    def _msg(self, message:str):
        """ Custom verbose print method
        
        Custom print method for console logging, if verbose
        class parameter is True.
        
        Parameters
        ----------
        message: str
            Message to be printed to the console
        """
        
        if self.verbose:
            print('{time} - {message}'.format(
                time=dt.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
                message=message
            ))
            
    def run_process(self):
        """ Runs the updater's main process
        
        Runs through all steps to get the EVE SDE data,
        and loads all provided processors against that data.
        """
        
        if self.diag:
            self._msg('Beginning SDE Update... (Diagnostic mode)')
        else:
            self._msg('Beginning SDE Update...')
        
        self.clear_sde_folder(self.sde_path)
        self.get_sde_data(self.sde_url)
        self.run_processors(self.processors)
        if not self.diag:
            self.clear_sde_folder(self.sde_path)
            self._msg('SDE Update Complete.')
        
    def clear_sde_folder(self, sde_path:str):
        """ Deletes the SDE folder, if present
        
        Removes the SDE folder, if present. Should be run
        before and after the SDE data is acquired.
        
        Parameters
        ----------
        sde_path: str
            The folder the SDE data is extracted to
        """
        
        self._msg('Clearing SDE Folder...')
        
        sde_loc = './{sde_path}'.format(sde_path=sde_path)
        if os.path.exists(sde_loc):
            shutil.rmtree(sde_loc)
            
    def get_sde_data(self, sde_url:str):
        """ Loads the SDE data
        
        Downloads and unzips the SDE data.
        
        Prarameters
        -----------
        sde_url: str
            The URL where the SDE data is found
        """
        
        self._msg('Getting SDE Data...')
        
        sde_data = rq.get(sde_url)
        with zf(io.BytesIO(sde_data.content)) as zip_file:
            zip_file.extractall()
        
    def run_processors(self, processors:list):
        """ Runs processors
        
        Runs all provided processors against downloaded
        SDE data.
        
        Parameters
        ----------
        processors: list
            List of processors to run against the SDE data
        """
        
        sde_file = '.'.join(self.sde_url.split('/')[-1].split('.')[:-1])
        
        if self.diag:
            self._msg('Building Processors...')
        else:
            self._msg('Starting Processors...')
        
        self.proc = [
            proc(self.sde_path, sde_file, verbose=self.verbose)
            for proc in processors
        ]
        
        if self.diag:
            self._msg('Diagnostic mode entered.')
        else:
            for proc in self.proc:
                if self.verbose: print('----------------')
                if not self.diag: proc.run_process()
            if self.verbose: print('----------------')