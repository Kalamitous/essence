$(document).ready(function() {
	$(".bar").hide()
	$(".upload").hide()
	
	$(".bar").css('top', window.innerHeight / 2.075 - $(".bar").height() / 2)
	
	$(window).on('resize', function() {
		$(".bar").css('top', window.innerHeight / 2.05 - $(".bar").height() / 2)
	})
	
	$("#barUpload").on('click', function(event) {
        $("input").trigger('click');
    });
	
	$('#fileSelect').change(function(event) {
		$("#barUpload").unbind('click')
		$(".bar").fadeOut(400, 'linear', function() {
			$(".upload").show(0, function() {
				$(this).css('opacity', '0.5')
			})
		})

		playMP3(this.files[0])
	})
	
	$(".upload").mouseenter(function() {
		if ($(".bar").is(':visible')) {
			return
		}
		
		$(this).css('opacity', '0.75')
	})
	
	$(".upload").mouseleave(function() {
		if ($(".bar").is(':visible')) {
			return
		}
		
		$(this).css('opacity', '0.5')
	})
	
	$("#barPlay").on('click', function(event) {
		$(this).unbind('click')
		$(".bar").fadeOut(400, 'linear', function() {
			$(".upload").show(0, function() {
				$(this).css('opacity', '0.5')
			})
		})
		
		var xhr = new XMLHttpRequest()
		xhr.open('GET', 'sample.mp3', true)
		xhr.responseType = 'blob'
		xhr.onload = function(event) {
			playMP3(this.response)
		}
		xhr.send()
    })
})