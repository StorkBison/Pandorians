$('body').on('click', '.open-faq-5-obj', function() {
    if($(this).attr('block') != 'open'){
        $(this).attr('block', 'open');
        $(this).find('.open-faq-5-obj-read').css('height', 'auto');
        $(this).find('.open-faq-5-obj-read').css('opacity', '1');
    }else{
        $(this).attr('block', 'close');
        $(this).find('.open-faq-5-obj-read').css('height', '0');
        $(this).find('.open-faq-5-obj-read').css('opacity', '0');
    }
});