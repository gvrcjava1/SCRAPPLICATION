import { OnInit, Component, ViewChild,ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource, MatPaginator, MatSort, MatDialog, MatDialogRef } from '@angular/material';
import { ContentManagementModel } from 'src/app/models/content-management.model';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { Constants } from 'src/app/common/constants';
import {environment} from './../../../environments/environment';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { FuseConfirmDialogComponent } from '../popup-dialogs/confirm-dialog/confirm-dialog.component';
import { ContentManagementDialogComponent } from '../popup-dialogs/content-management-edit-dialog/content-management-edit-dialog.component';


@Component({
    selector: 'content-management',
    templateUrl: './content-management.component.html',
    styleUrls: ['./content-management.component.scss']
})
export class ContentManagementComponent implements OnInit {
    pagination = Constants.PAGINATION_NUMBERS;
    FiledLabels = FieldLabelsConstant.LABELS;
    Titles = FieldLabelsConstant.TITLE;
    title: string = Constants.EVENTS.ADD;
    editPermission: boolean = true;
    addPermission: boolean = true;
    deletePermission: boolean = true;
    filesExists: boolean = false;
    isSubmit: boolean = false;
    isReadOnly: boolean = true;
    onlyDrawing: boolean = false;
    update: boolean = false;
    makeList:any;
    selectedFiles: File[] = [];
    uploadedFilesList: any;
    selectedGenOps;
    selected:string;
    filterData;
    modelList:any;
    visible:boolean;
    userdata: any = JSON.parse(sessionStorage.getItem('userData'));
    contentManagementFormGroup: FormGroup;
    progress: { percentage: number } = { percentage: 0 }
    pattern = "[a-zA-Z][a-zA-Z ]*";
    GenOpsArray = [{ ID: 1, VALUE: 'Circulars' }, { ID: 2, VALUE: 'Drawing' }, { ID: 3, VALUE: 'Tech Specs' }, { ID: 4, VALUE: 'Operational Manual' }, { ID: 5, VALUE: 'User manuals' }];
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    displayedColumns = ['sno', 'originalFileName','size', 'genOps','assetTypeRlyId','make','model', 'description', 'actions'];
    dataSource: MatTableDataSource<ContentManagementModel>;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    contentManagementDialogRef: MatDialogRef<ContentManagementDialogComponent>;
    gridData = [];
    url=environment.apiUrl;
    showButton: boolean;
    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private spinnerService: Ng4LoadingSpinnerService,
        private commonService: CommonService,
        private sendAndGetService:SendAndRequestService        
    ) {
    }
    ngOnInit() {
        this.init();
       
      
        this.filterData = {
            filterColumnNames: [
              { "Key": 'sno', "Value": " " },
              { "Key": 'originalFileName', "Value": " " },
              { "Key": 'size', "Value": " " },
              { "Key": 'genOps', "Value": " " },
              { "Key": 'assetTypeRlyId', "Value": " " },
              { "Key": 'make', "Value": " "},
              { "Key": 'model', "Value": " " },
              { "Key": 'description', "Value": " " },
             
            ],
            gridData: this.gridData,
            dataSource: this.dataSource,
            paginator: this.paginator,
            sort: this.sort
          };
    }
    updatePagination() {
      
        this.filterData.dataSource = this.filterData.dataSource;
        this.filterData.dataSource.paginator = this.paginator;
      }
    init(){
        this.createCMForm();
        
                var permissionName = this.commonService.getPermissionNameByLoggedData("CONTENT MANAGEMENT","CONTENT MANAGEMENT") ;
                  this.addPermission = this.commonService.getPermissionByType("Add", permissionName); 
                this.editPermission = this.commonService.getPermissionByType("Edit", permissionName);
                this.deletePermission = this.commonService.getPermissionByType("Delete", permissionName);
        
                this.contentManagementFormGroup.get('GenOps').valueChanges.subscribe(item => {
                })
    }
    createCMForm() {
        this.contentManagementFormGroup = this.formBuilder.group({
            GenOps: ['', Validators.required],
            description: ['', Validators.compose([Validators.required])],
            uploadFiles: ['', Validators.required],
            assetTypeRlyId: ['', Validators.compose([Validators.required])],
            make: ['', Validators.compose([Validators.required, Validators.pattern(this.pattern)])],
            model: ['', Validators.compose([Validators.required])],
            docCategory: ['', Validators.compose([Validators.required, Validators.pattern(this.pattern)])],
        });
    }

    getUploadedFiles() {
        this.spinnerService.show();
        const uploadedFiles: ContentManagementModel[] = [];      
        this.sendAndGetService.requestForGET(Constants.app_urls.DOCS.GET_UPLOAD_FILES+this.userdata.id+'/'+this.selected ).subscribe(data => {
            this.spinnerService.hide();

            this.uploadedFilesList = data;
            for (let i = 0; i < this.uploadedFilesList.length; i++) {
                this.uploadedFilesList[i].sno = i + 1;
                uploadedFiles.push(this.uploadedFilesList[i]);
            }
            this.filterData.gridData = uploadedFiles;
            this.dataSource = new MatTableDataSource(uploadedFiles);
            this.commonService.updateDataSource(this.dataSource, this.displayedColumns);
            this.filterData.dataSource = this.dataSource;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        }, error => {
            console.log('ERROR >>> ' + error);
            this.spinnerService.hide();
        })
    }
    applyFilter(filterValue: string) {
    
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.dataSource.filter = filterValue;
    }

    public get f() { return this.contentManagementFormGroup.controls; }

    upload(event) {
        if (event.target.files.length > 0) { this.filesExists = true; this.showButton = true; }
        for (var i = 0; i < event.target.files.length; i++) {
            this.selectedFiles.push(event.target.files[i]);
        }
    }
    removeFile(id) {
        this.selectedFiles.splice(id, 1);
        this.showButton = false;
    }
    onContentManagementSubmit() {
        if (this.onlyDrawing) {
            this.isSubmit = true;
            if (this.contentManagementFormGroup.invalid) {
                this.isSubmit = false;
                return;
            }
        } else {
            if (this.contentManagementFormGroup.value.description == '' ||
                this.contentManagementFormGroup.value.GenOps == '' ||
                this.contentManagementFormGroup.value.uploadFiles == '') {
                this.isSubmit = false;
                return false;
            } else {
                this.isSubmit = true;
            }
        }
        if (this.isSubmit) {
            this.spinnerService.show();
            let opsId = this.contentManagementFormGroup.value.GenOps;
            let description = this.contentManagementFormGroup.value.description;
            let ops = this.GenOpsArray.filter(function (value) {
                return opsId == value.ID;
            });

            let saveDetails = {
                'description': this.contentManagementFormGroup.value.description,
                'divisionCode': this.userdata.divisionCode,
                'createdBy': this.userdata.id,
                'createdDate': new Date(),
                'GenOps': ops[0].VALUE,
                'zonal': 'zonal',
                'FU': 'PSI',
                'topic': 'Indents',
                "assetTypeRlyId": this.contentManagementFormGroup.value.assetTypeRlyId,
                "make": this.contentManagementFormGroup.value.make,
                "model": this.contentManagementFormGroup.value.model,
                "docCategory": this.contentManagementFormGroup.value.docCategory,
            }
            let formdata: FormData = new FormData();
            for(var i=0;i<this.selectedFiles.length;i++){
                formdata.append('file', this.selectedFiles[i]);
            }
            formdata.append('GenOps', saveDetails.GenOps);
            formdata.append('description', saveDetails.description);
            formdata.append('divisionCode', saveDetails.divisionCode);
            formdata.append('createdBy', saveDetails.createdBy);
            formdata.append('zonal', saveDetails.zonal);
            formdata.append('FU', saveDetails.FU);
            formdata.append('topic', saveDetails.topic);
            formdata.append('assetTypeRlyId', saveDetails.assetTypeRlyId);
            formdata.append('make', saveDetails.make);
            formdata.append('model', saveDetails.model);
            formdata.append('docCategory', saveDetails.docCategory);        
            this.sendAndGetService.requestForPOST(Constants.app_urls.DOCS.UPLOAD_ATTACHED_FILE, formdata, true).subscribe(data => {
                this.spinnerService.hide();
                this.commonService.showAlertMessage("Files Uploaded and Saved Successfully");
                this.selectedFiles = [];
                this.filesExists = false;
                this.getUploadedFiles();
                this.showButton = false;
                this.contentManagementFormGroup.reset();
                this.isSubmit = false;
            }, error => {
                console.log('ERROR >>> ' + error);
                this.spinnerService.hide();
                this.commonService.showAlertMessage("Files Uploading Failed.");
            })
        }
    }

    deleteFile(id: number) {
        this.spinnerService.show();
        this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
            disableClose: false
          });
         this.confirmDialogRef.componentInstance.confirmMessage = "Are you sure you want to delete the Document item?";
        this.confirmDialogRef.afterClosed().subscribe(result => {
            if(result){
                this.sendAndGetService.requestForDELETE(Constants.app_urls.DOCS.DELETE_DOCS,id).subscribe(data => {
                    this.spinnerService.hide();
                    this.commonService.showAlertMessage("Deleted Successfully");
                    this.selectedFiles = [];
                    this.filesExists = false;
                    this.showButton = false;
                    this.contentManagementFormGroup.reset();
                    this.getUploadedFiles();
                }, error => {
                    console.log('ERROR >>> ' + error);
                    this.spinnerService.hide();
                    this.commonService.showAlertMessage("Files Deleting Failed.");
                })
            }
       })         
    }
    editDescription(id: number) {
        let selectedRow = this.dataSource.filteredData.filter(data => {
            return id == data.id;
        });
        this.contentManagementDialogRef = this.dialog.open(ContentManagementDialogComponent, {
            disableClose: false,
            //height: '200px',
            width: '40%',
            data: selectedRow
        });
        this.contentManagementDialogRef.afterClosed().subscribe(result => {
            this.getUploadedFiles();
        });
    }


    genOpsChange() {
        if(this.selectedGenOps){
        let id = this.selectedGenOps;
        let ops = this.GenOpsArray.find(function (value) {
            return id == value.ID;
        });
        if (this.selectedGenOps == 2) {
            this.onlyDrawing = true;
        } else {
            this.onlyDrawing = false;
        }
        this.selected = ops.VALUE;
        this.getUploadedFiles();
        }
    }

    gen(){
       
        if(this.selectedGenOps){    
            let id = this.selectedGenOps; 
        let ops = this.GenOpsArray.filter(function (value) {
            return id == value.ID;
        });
        if(this.selectedGenOps==2)
        {
            this.visible=true;
            this.sendAndGetService.requestForGET(Constants.app_urls.DOCS.GET_ALL).subscribe((data) => {
                this.makeList = data;
       }); 
              this.sendAndGetService.requestForGET(Constants.app_urls.DOCS.GET_ALL).subscribe((data) => {
                this.modelList = data;
        });
    }

        else{
            this.visible=false;
        }
        
    }
    }


}