import { Component, OnInit } from '@angular/core';
import *  as  mapData from './csvjson.json';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';
declare var $: any; 
import $ from 'jquery';
import { useGeographic } from 'ol/proj';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Constants } from 'src/app/common/constants';

useGeographic();

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.css']
})
export class GoogelMapComponent implements OnInit {
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData')); 
  oheLocList : any ;  
   zoom: number = 8;
  addKilometers: FormGroup;
  // initial center position for the map
  latitude: number = 51.673858;
  longitude: number = 7.815982;
  //markers: marker[] = (mapData as any) ;
   Style1:any;
  constructor(    
   private sendAndRequestService : SendAndRequestService,
   private formBuilder: FormBuilder,
  ) { }
  ngOnInit() {   
   
   this.addKilometers = this.formBuilder.group({    
    'fromKm': [null, Validators.required],
    'toKm': [null,Validators.required]
    
  }); 
   
  }
  submitKilometers() { 
  
      let  data ={
        fromKm:this.addKilometers.controls['fromKm'].value,
        toKm:this.addKilometers.controls['toKm'].value
    }
     this.sendAndRequestService.requestForPOST
      (Constants.app_urls.ENERGY_BILL_PAYMENTS.OHELOCATION.GET_LATITUDES_AND_LONGITUDES,data,true)     
 .subscribe((data) => {  
       
       this.oheLocList = data;
       
       if(this.oheLocList){       
            this.startMap();
       }
      })
  } 
  startMap() {  
    const features = new Array(this.oheLocList.length);      
    
    for (var i = 0; i < this.oheLocList.length; i++) { 
      var section =   this.oheLocList[i].section; 
      var assetType = this.oheLocList[i].assetType;
      var assetId = this.oheLocList[i].assetId;
      var schedule = this.oheLocList[i].schedule;
      var overDues = this.oheLocList[i].overDues;
      const feature = new Feature(new Point([this.oheLocList[i].longitude, this.oheLocList[i].latitude]));
      feature.set("label",section);
      feature.set("assetType",assetType );
      feature.set("assetId",assetId);
      feature.set("schedule",schedule );
      feature.set("overDues",overDues );
      features[i] = feature;
      
    }


    const map = new Map({
      target: 'map',      
      view: new View({
        center: [78.9629, 20.5937],
        zoom: 5
      }),
      layers: [
        new TileLayer({
          source: new OSM()
        }),
       
        new VectorLayer({
          source: new VectorSource({
            features: features,
          }),
          
          style: function (feature) {           
           let  style1;
          if(feature.get("overDue")){
            if(feature.get("overDue").includes("Yes")){
           style1= new Style({
              image: new Circle({
                radius: 10,
                fill: new Fill({ color: '#FF0000' }),
                stroke: new Stroke({ color: '#000000', width: 1 })
              }),
              text: new Text({
                text: feature.get("label"),
                offsetY: 15,
                fill: new Fill({
                  color: '#000000'
                }),
              
              })
            });
           }
           else {
            style1= new Style({
              image: new Circle({
                radius: 10,
                fill: new Fill({ color: '#0000ff' }),
                stroke: new Stroke({ color: '#000000', width: 1 })
              }),
              text: new Text({
                text: feature.get("label"),
                offsetY: 15,
                fill: new Fill({
                  color: '#000000'
                }),
               
              })
            }); 
           }
          } else{
            style1= new Style({
              image: new Circle({
                radius: 10,
                fill: new Fill({ color: '#ffff00' }),
                stroke: new Stroke({ color: '#000000', width: 1 })
              }),
              text: new Text({
                text: feature.get("label"),
                offsetY: 15,
                fill: new Fill({
                  color: '#000000'
                }),
               
              })
            });
           }
          
            return  style1;          
            
          }
        }),
      ],

    });

    const element = document.getElementById('popup');

    const popup = new Overlay({
      element: element,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10],
    });
    map.addOverlay(popup);

    const info = document.getElementById('info');
    map.on('moveend', function () {
      const view = map.getView();
      const center = view.getCenter();
      info.innerHTML = `
  <table>
    <tbody>
      <tr><th>Longitude: </th><td>${center[0]}</td></tr>
      <tr><th>Latitude: </th><td>${center[1]}</td></tr>
    </tbody>
  </table>`;
    });

    map.on('click', function (event) {
      const feature = map.getFeaturesAtPixel(event.pixel)[0];
      if (feature) {
        const point = <Point>feature.getGeometry();
        const coordinate = point.getFlatCoordinates();
        popup.setPosition(coordinate);
        $('#popup').popover({
          container: element.parentElement,
          html: true,
          sanitize: false,
          content: `
          <table>
            <tbody>
              <tr><th>Section: </th><td>${feature.getProperties().label}</td></tr>  
              <tr><th>assetType: </th><td>${feature.getProperties().assetType}</td></tr>          
              <tr><th>assetId: </th><td>${feature.getProperties().assetId}</td></tr>
              <tr><th>schedule: </th><td>${feature.getProperties().schedule}</td></tr>
              <tr><th>overDue: </th><td>${feature.getProperties().overDues}</td></tr>
            </tbody>
          </table>`,
          placement: 'top',
        });
        $(element).popover('show');
      } else {
        $(element).popover('dispose');
      }
    });

    map.on('pointermove', function (event) {
      if (map.hasFeatureAtPixel(event.pixel)) {
        map.getViewport().style.cursor = 'pointer';
      } else {
        map.getViewport().style.cursor = 'inherit';
      }
    });
  }

}


// just an interface for type safety.
interface marker {
  lat: number;
  lng: number;
  label?: string;
  draggable: boolean;
}