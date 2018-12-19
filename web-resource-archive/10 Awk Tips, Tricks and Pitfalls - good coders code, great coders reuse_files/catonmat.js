/*
** Peteris Krumins (peter@catonmat.net)
** http://www.catonmat.net  --  good coders code, great reuse
**
** The new catonmat.net website.
**
** Code is licensed under GNU GPL license.
*/

var ajax = {
  /* Ajax POST function which calls successf on success and failuref on failure */
  post: function(url, data, successf, failuref) {
    $.ajax({
      url:      url,
      type:     'POST',
      dataType: 'json',
      data:     data,
      error:    failuref,
      success:  successf
    });
  }
};

var catonmat = {

  /* Displays the comment form #comment_form after the element 
  ** 'element' and sets the hidden parent_id field to 'parent_id'.
  */
  show_comment_form: function(element, parent_id) {
    /* Display the comment form after 'element' and slide it out nicely */
    $('#comment_form').
      insertAfter(element).
      hide().
      slideDown('slow');

    /* Set the parent_id form value to the id of the comment we are
    ** replying to. */
    $('#parent_id').val(parent_id);
  },

  /* Restores the reply form to the end of the article (cancels replying). */
  restore_comment_form: function(default_comment_id) {
    $('.comment_reply a.cancel').hide();
    var p = $('#cancel_comment');
    if (!p.is(':hidden')) {
      catonmat.show_comment_form(p, default_comment_id);
      p.hide();
    }
  },

  /* Attaches reply comment handler to the given <a> */
  attach_reply_comment_handler: function(a, loc, default_comment_id) {
    a.click(
      function(event) {
        var parent_id = this.id.split('_')[2];
        catonmat.show_comment_form($(this).parent(), parent_id);

        /* Hide all existing 'Cancel' buttons */
        $('.comment_reply a.cancel').hide();
        $('#cancel_comment').hide()

        /* Add a paragraph at the end of the comment list with a link to
        ** cancel replying, if the user wants just to add a new comment. */
        var a = $('<a href="#">Click here</a>').click(
                  function(event) {
                    catonmat.restore_comment_form(default_comment_id);
                    event.preventDefault();
                  }
                );

        var p_text;
        if (loc == 'page') {
          p_text = ' to leave a new comment instead of replying to someone.';
        }
        else {
          p_text = ' to reply to the original comment instead of replying to someone in the comment thread.';
        }

        $('<p>').
          attr('id', 'cancel_comment').
          append(a).
          append(p_text).
          insertAfter('div.add h3');

        /* Add the 'Cancel' button, which when clicked cancels the comment form,
        ** and restores it back to the end of the article. */
        $('<a href="#" class="cancel">Cancel</a>').
          insertAfter(this).click(
            function(event) {
              catonmat.restore_comment_form(default_comment_id);
              event.preventDefault();
          }
        );
        event.preventDefault();
      }
    );
  },

  /* Attach event handler to 'Reply to this comment', etc. */
  init_comments: function(loc, default_comment_id) {
    $('.comment_reply a.reply').each(
      function(_) {
        catonmat.attach_reply_comment_handler($(this), loc, default_comment_id);
      }
    );

    $('.icomment a.deleter').click(function (ev) {
      ev.preventDefault();
      var id = $(this).text().split('-')[1];
      $.get('/admin/comments/delete_comment?id='+id);
      $(this).parent().parent().parent().parent().remove();
    });
  },

  init_toggle_contacts: function() {
    var img_more = $("<img src=\"/static/img/more-10x10.gif\" class=\"more\">");
    var img_less = $("<img src=\"/static/img/less-10x10.gif\" class=\"more\">");
    $('#a-more-contacts').click(
      function(event) {
        if ($(this).text() === "more") {
          $(this).text("less").prepend(img_less);
        }
        else {
          $(this).text("more").prepend(img_more);
        }
        $('#div-more-contacts').slideToggle('fast');
        event.preventDefault();
      }
    );
  },

  init_why_email: function() {
    $('#why_email_a').click(
      function(event) {
        $('#why_email_explain').slideToggle('fast');
        event.preventDefault();
      }
    );
  },

  init_comment_help: function() {
    $('#ch').click(
      function(event) {
        $('#comment_help').slideToggle('fast');
        event.preventDefault();
      }
    );
  },


  comment_error: function(error) {
    $('#comment_error').
      html('<span class="error">' + error + '</span>').
      slideDown('fast');
  },

  ajax_comment_and_proceed: function(url, proceed) {
    ajax.post(
      url,
      $('#comment_form form').serialize(),
      function(data) {
        proceed(data);
      },
      function(_, error) {
        var a = 'peter';
        var b = 'catonmat.net';
        var e = a + '@' + b;
        catonmat.comment_error(
          "The comment didn't get posted (Ajax error: " + error + "). " +
          "Please try again! " +
          "If it still doesn't work, please copy the comment and send it to me " +
          'via e-mail (<a href="mailto:' + e + '">' + e + '</a>) or ' +
          'via <a href="/feedback/">Feedback</a> form. Thanks!'
        );
      }
    );
  },

  init_preview_comment: function() {
    $('#preview').click(
      function(event) {
        $('#comment_error').slideUp();
        catonmat.ajax_comment_and_proceed(
          "/_services/comment_preview",
          function(data) {
            if (data.status === "error") {
              $('#comment_preview').slideUp();
              catonmat.comment_error(data.message);
            }
            else {
              $('#comment_preview').
                html(data.comment).
                slideDown('fast');
            }
          }
        );
        event.preventDefault();
      }
    );
  },

  display_new_comment: function(comment, default_comment_id) {
    var find_parent_and_indent = function() {
      var parent, indent;
     
      /* Try finding the comment the user may be replying to. */
      parent = $('#comment_form').parents('.icomment');
      if (parent.length) {
        indent = parseInt(parent.css('margin-left'));
        return [parent, indent+20]
      }

      /* User is not replying. Try finding the very last comment. */
      parent = $('#comment_list .icomment:last');
      if (parent.length) {
        return [parent, 0];
      }

      /* There are no comments on the page. Create a new comment 
      ** after <h3>Comments</h3>. */
      return [$('#comment_list h3'), 0];
    };

    var pi = find_parent_and_indent();
    var parent = pi[0];
    var indent = pi[1];

    /* Hide "be the first to comment" message */
    $('p.nocomm').hide();

    /* Add the new comment */
    var comment = $(comment)
        .css('margin-left', indent + 'px')
        .css('border', '1px solid #D6A23D')
        .css('padding', '5px')
        .insertAfter(parent)
        .hide()
        .slideDown('slow');

    /* Attach "Reply to this comment" event handler */
    catonmat.attach_reply_comment_handler(
        $('.comment_reply a.reply', comment)
    );

    /* Hide the possible error and preview messages */
    $('#comment_error').hide();
    $('#comment_preview').hide();

    /* Restore the comment form to the bottom of the page */
    catonmat.restore_comment_form(default_comment_id);

    /* Clear the user's comment from comment <textarea> */
    $('#comment').val('');
  },

  init_submit_comment: function(default_comment_id) {
    $('#submit').click(
      function(event) {
        var button = this;
        $(button).val("Submitting... Please wait...");
        $(button).attr('disabled', true);
        catonmat.ajax_comment_and_proceed(
          "/_services/comment_add",
          function(data) {
            $(button).val("Submit comment");
            $(button).attr('disabled', false);
            if (data.status === "error") {
              catonmat.comment_error(data.message);
            }
            else {
              catonmat.display_new_comment(data.comment, default_comment_id);
            }
          }
        );
        event.preventDefault();
      }
    );
  }
};

