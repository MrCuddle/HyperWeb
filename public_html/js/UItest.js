/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


   $(document).ready(function(){
       $('#test').addClass('showtest').hide();
       
       
       $('#test button').on('click', function(){
           if(this.id === 'button_close'){
               playmola.cancelConnectObjects();
               $('#test').hide();
           } else {
                playmola.connectObjects();
                $('#test').hide();
           }
       });
       
       $('#button_schematic_mode').on('click', function(){
           playmola.enterSchematicMode();
       });
       
   });