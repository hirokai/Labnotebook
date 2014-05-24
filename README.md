# Lab notebook prototype

The repository for [Electronic labnote prototype](http://labnote.meteor.com/). Beta version.

## Principles

* Easy and consistent management of experimental samples and protocols using an easy-to-use GUI.
* Treating experiment as a transformation between samples. Experiment is considered as a directed graph.
   * Experimental samples are nodes of a graph.
   * Steps of experiment are edges of a graph.
* Emphasis on interoperability with common data storage systems and formats.
    * Google Drive
    * Dropbox
    * JSON export/import
* Real-time, complete logging of all changes to data.
    * This will help avoid the risk of falsification of experimental record.
* Every sample has a type (just like variables in statically typed programming languages), and all samples are managed in a type-safe manner.

## Remarkable features

* Defining an experimental protocol using a flowchart.
    * Experiments are defined in a logically organized manner.
    * Samples can be associated with any step within the experiment.
* Recording of experiment is easily done based on the protocol defined above.
    * A sreadsheet is prepared automatically from the protocol you define.
    * Recording time is just one click.
* Integration with Google Drive.
    * Files and folders can be attached from Google Drive.
    * Export of data to Google Drive is just one click.
        * Entire database
        * Experiment and samples information
        * Change logs
* All change history (input, change, and deletion of data) is logged in a real time manner.
* Attachment of files from Google Drive and Dropbox.

## Features to be implemented

* Calculator for planning experiment.
* Timers for experiment.
    * Some experimental protocol has a specific time requirement, and this will help you do experiment without traditional timers.
* Analysis over multiple experiments.
    * Aggregated view of experimental parameters.

## Language and technologies used

* JavaScript
* [Meteor](http://meteor.com)
* [Bootstrap](http://getbootstrap.com/)
* [D3.js](http://d3js.org/)
* [dagre-d3](https://github.com/cpettitt/dagre-d3)
* etc.
