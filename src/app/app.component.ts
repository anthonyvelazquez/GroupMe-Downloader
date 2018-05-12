import { Component } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import {URLSearchParams} from '@angular/http';
import { ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/operator/map';

import * as JSZip from 'jszip';
import * as JSZipUtils from '../assets/jszip-utils';
import { saveAs } from 'file-saver/FileSaver';

class Image {
  date: string;
  link: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  apiRoot: string = "https://api.groupme.com/v3";
  token: string = "";
  limit: 100;
  before: "";
  title = 'GroupMe Gallery Downloader';
  Validated: boolean = false;
  Searched: boolean = false;
  Downloaded: boolean = false;
  Groups = [];
  SelectedGroup = {};
  Images: Image[] = [];
  BulkImageLinks = [];
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  FavoriteImage: string;
  FavoriteImageCount: number = 0;
  
  constructor(private http: Http, private ref: ChangeDetectorRef) {}

  ngOnInit() {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10
    };
  }

  doGET() {
    console.log("GET");
    let url = this.apiRoot + "/get";
    this.http.get(url).subscribe(res => console.log(res.json())); 
  }

  GetGroups() {
    console.log("Getting Active GroupMe Groups: Token - " + this.token);
    let url = this.apiRoot + "/groups";
    let search = new URLSearchParams();
    search.set('token', this.token);
    this.http.get(url, {search: search}).subscribe(res => {
      console.log(res.json()['response'])
      let GroupData = res.json()['response'];
      for(var i=0; i<GroupData.length;i++)
      {
        this.Groups = [...this.Groups, {id: GroupData[i]['group_id'], name: GroupData[i]['name']}]
      }
      this.Validated = true;
    });
  }

  GetImages() {
    console.log("Getting GroupMe Gallery Images: Group ID - " + this.SelectedGroup);
    let url = this.apiRoot + "/conversations/" + this.SelectedGroup + "/gallery";
    let search = new URLSearchParams();
    search.set('token', this.token);
    search.set('limit', "100");
    search.set('before', this.before);
    this.http.get(url, {search: search}).subscribe(res => {
      console.log(res.json()['response'])
      let ImageData = res.json()['response']['messages'];
      this.Images = ImageData;
      this.dtTrigger.next();
      this.Searched = true;
    });
  }

  GetAllImages() {
    this.Downloaded = true;
    console.log("Getting All GroupMe Gallery Images: Group ID - " + this.SelectedGroup);
    let url = this.apiRoot + "/conversations/" + this.SelectedGroup + "/gallery";
    let search = new URLSearchParams();
    search.set('token', this.token);
    search.set('limit', "100");
    search.set('before', this.before);
    this.http.get(url, {search: search}).subscribe(res => {
      console.log(res.json()['response'])
      let ImageData = res.json()['response']['messages'];
      let ImagesAvailable = !!ImageData.length;
      if(ImagesAvailable)
      {
        for(var i=0; i<ImageData.length;i++)
        {
          this.BulkImageLinks = [...this.BulkImageLinks, ImageData[i]]
          console.log(ImageData[i].favorited_by.length)
          if(ImageData[i].favorited_by.length > this.FavoriteImageCount)
          {
            this.FavoriteImage = ImageData[i].attachments[0].url;
            this.FavoriteImageCount = ImageData[i].favorited_by.length;
          }

        }
        console.log(this.BulkImageLinks[1])
        this.before = ImageData[ImageData.length - 1]['gallery_ts']
        this.GetAllImages();
      }
    });
  }

  DownloadAllImages() {
    let file = this.BulkImageLinks.pop();
    var theAnchor = $('<a />')  
        .attr('href', file)  
        .attr('download',file);  
    // theAnchor[0].click();   
    // theAnchor.remove();
    console.log("Current File: " + file)
    JSZipUtils.getBinaryContent(file, function (err, data) {
      console.log(data)
      let zip: JSZip = new JSZip();
      zip.file("Hello.jpeg", data);
      zip.generateAsync({type:"blob"})
      .then(function(content) {
          // see FileSaver.js
          saveAs(content, "GroupMe Images.zip");
      });
    });
  }

  HideSection() {
    this.Searched = false;
    this.Downloaded = false;
  }

  doPOST() {
    console.log("POST");
    let url = this.apiRoot + "/post";
    this.http.post(url, {moo:"foo",goo:"loo"}).subscribe(res => console.log(res.json()));
  }


  // doPOST() {
  //   console.log("POST");
  //   let url = this.apiRoot + "/post";
  //   let search = new URLSearchParams();
  //   search.set('foo', 'moo');
  //   search.set('limit', 25);
  //   this.http.post(url, {moo:"foo",goo:"loo"}, {search}).subscribe(res => console.log(res.json()));
  // }
  
}

// https://codecraft.tv/courses/angular/http/core-http-api/
// https://l-lin.github.io/angular-datatables/#/welcome
// https://github.com/Stuk/jszip-utils
// https://stackoverflow.com/questions/41710107/jszip-only-zipping-one-of-the-two-files-from-url